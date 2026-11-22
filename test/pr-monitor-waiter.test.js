const path = require('path');
const { EventEmitter } = require('events');

const {
  EVENT_TYPES,
  WAIT_POLL_INTERVAL_MS,
  buildWaitListenArgs,
  applyCursor,
  createCommentKey,
  cursorPath,
  loadCursor,
  saveCursor,
  clearCursor,
  createWaiter,
  main,
} = require('../skills/pr-lifecycle-monitor/wait-for-activity');

function fakeFs(files = {}) {
  const data = { ...files };
  return {
    data,
    existsSync: jest.fn((filePath) => Object.prototype.hasOwnProperty.call(data, filePath)),
    readFileSync: jest.fn((filePath) => data[filePath]),
    writeFileSync: jest.fn((filePath, contents) => { data[filePath] = contents; }),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn((filePath) => { delete data[filePath]; }),
  };
}

describe('pr-lifecycle-monitor notification waiter skeleton', () => {
  test('builds a one-event gh listener for a tracked PR', () => {
    const pr = { number: 12, url: 'https://github.com/o/r/pull/12' };

    expect(buildWaitListenArgs(pr)).toEqual([
      'event', 'listen',
      '--resource', 'https://github.com/o/r/pull/12',
      '--count', '1',
      '--event', EVENT_TYPES.join(','),
    ]);
  });

  test('stores one cursor per PR under the temp directory', () => {
    const pr = { number: 12 };
    const options = { tempDir: path.join('tmp', 'opencode') };

    expect(cursorPath(pr, options)).toBe(
      path.join('tmp', 'opencode', 'pr-lifecycle-monitor-12.cursor.json')
    );
  });

  test('loads, saves, and clears a cursor through injected filesystem calls', () => {
    const pr = { number: 12 };
    const options = { tempDir: path.join('tmp', 'opencode'), fs: fakeFs() };
    const cursor = { seen: ['1::2026-11-22T10:00:00Z'] };

    expect(loadCursor(pr, options)).toEqual({ seen: [] });
    saveCursor(pr, cursor, options);
    expect(options.fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(loadCursor(pr, options)).toEqual(cursor);
    clearCursor(pr, options);
    expect(options.fs.unlinkSync).toHaveBeenCalledTimes(1);
    expect(loadCursor(pr, options)).toEqual({ seen: [] });
  });

  test('applies a cursor so existing comments are suppressed and edits are fresh', () => {
    const first = { id: 1, updated_at: '2026-11-22T10:00:00Z', body: 'hi' };
    const edited = { ...first, updated_at: '2026-11-22T10:05:00Z', body: 'again' };

    expect(createCommentKey(first)).toBe('1::2026-11-22T10:00:00Z');

    const initial = applyCursor({ seen: [] }, [first]);
    expect(initial.fresh).toEqual([first]);
    expect(initial.cursor.seen).toEqual(['1::2026-11-22T10:00:00Z']);

    const duplicate = applyCursor(initial.cursor, [{ ...first }]);
    expect(duplicate.fresh).toEqual([]);

    const changed = applyCursor(duplicate.cursor, [edited]);
    expect(changed.fresh).toEqual([edited]);
  });

  test('main rejects missing PR input without touching gh', async () => {
    const stderr = { write: jest.fn() };
    const stdout = { write: jest.fn() };
    const code = await main([], { stderr, stdout });

    expect(code).toBe(1);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    expect(stdout.write).not.toHaveBeenCalled();
  });
});

describe('pr-lifecycle-monitor notification waiter detection', () => {
  const pr = { number: 12, branch: 'pr-monitor-idea', url: 'https://github.com/o/r/pull/12' };

  function childProcess() {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = jest.fn();
    return child;
  }

  function waiterOptions(overrides = {}) {
    return {
      prs: [pr],
      tempDir: path.join('tmp', 'opencode'),
      fs: fakeFs(),
      spawn: jest.fn(() => childProcess()),
      fetchPr: jest.fn(async () => ({ state: 'OPEN' })),
      fetchComments: jest.fn(async () => []),
      sleep: jest.fn(async () => {}),
      emit: jest.fn(),
      onError: jest.fn(),
      ...overrides,
    };
  }

  test('uses a ten-second poll interval', () => {
    expect(WAIT_POLL_INTERVAL_MS).toBe(10000);
  });

  test('seeds existing comments without notifying, then exits on a new comment', async () => {
    const first = { id: 1, updated_at: '2026-11-22T10:00:00Z', body: 'old' };
    const fresh = { id: 2, updated_at: '2026-11-22T10:10:00Z', body: 'new' };
    const fetchComments = jest.fn()
      .mockResolvedValueOnce([first])
      .mockResolvedValueOnce([first, fresh]);
    const options = waiterOptions({ fetchComments });
    const waiter = createWaiter(options);

    const activity = await waiter.start();

    expect(activity.type).toBe('comment');
    expect(activity.comments).toEqual([fresh]);
    expect(options.emit).toHaveBeenCalledTimes(1);
    expect(JSON.parse(options.emit.mock.calls[0][0])).toEqual(activity);
    expect(options.spawn).toHaveBeenCalledWith('gh', buildWaitListenArgs(pr), expect.any(Object));
  });

  test('exits on a merged state change and clears the cursor', async () => {
    const options = waiterOptions({
      fetchPr: jest.fn()
        .mockResolvedValueOnce({ state: 'OPEN' })
        .mockResolvedValueOnce({ state: 'MERGED', merged_at: '2026-11-22T10:20:00Z' }),
    });
    const waiter = createWaiter(options);

    const activity = await waiter.start();

    expect(activity).toMatchObject({ type: 'state', status: 'merged' });
    expect(waiter.state.finished).toBe(true);
    expect(options.fs.unlinkSync).toHaveBeenCalledTimes(1);
  });

  test('falls back to polling when event listening fails', async () => {
    const child = childProcess();
    const fresh = { id: 3, updated_at: '2026-11-22T10:30:00Z', body: 'fallback' };
    const options = waiterOptions({
      spawn: jest.fn(() => child),
      fetchComments: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([fresh]),
      sleep: jest.fn(async () => {
        child.emit('error', new Error('event unavailable'));
        child.emit('close', 1);
      }),
    });
    const waiter = createWaiter(options);

    const activity = await waiter.start();

    expect(options.onError).toHaveBeenCalledWith(expect.stringContaining('event unavailable'));
    expect(activity.comments).toEqual([fresh]);
    expect(options.emit).toHaveBeenCalledTimes(1);
  });

  test('event and poll races produce only one activity record', async () => {
    const child = childProcess();
    const fresh = { id: 4, updated_at: '2026-11-22T10:40:00Z', body: 'race' };
    const options = waiterOptions({
      spawn: jest.fn(() => child),
      fetchComments: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValue([fresh]),
      sleep: jest.fn(async () => {
        child.stdout.emit('data', JSON.stringify({
          type: EVENT_TYPES[0],
          data: { api_url: 'https://api.github.com/repos/o/r/pulls/12/reviews/1' },
        }));
      }),
    });
    const waiter = createWaiter(options);

    await waiter.start();
    await Promise.resolve();

    expect(options.emit).toHaveBeenCalledTimes(1);
  });

  test('stop clears the cursor and kills event children', async () => {
    const child = childProcess();
    let waiter;
    const options = waiterOptions({
      spawn: jest.fn(() => child),
      fetchComments: jest.fn(async () => []),
      sleep: jest.fn(async () => { waiter.stop(); }),
    });
    waiter = createWaiter(options);

    const activity = await waiter.start();

    expect(activity).toBeNull();
    expect(options.fs.unlinkSync).toHaveBeenCalledTimes(1);
    expect(child.kill).toHaveBeenCalledTimes(1);
  });
});
