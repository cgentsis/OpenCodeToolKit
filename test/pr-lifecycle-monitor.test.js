const { EventEmitter } = require('events');

const {
  POLL_INTERVAL_MS,
  EVENT_TYPES,
  createCommentKey,
  dedupeComments,
  mapEventToPr,
  isMerged,
  isClosed,
  buildListenArgs,
  createWatcher,
} = require('../skills/pr-lifecycle-monitor/monitor');
const {
  ALLOWED_AUTONOMOUS_ACTIONS,
  formatApprovalCard,
  createReactionLayer,
} = require('../skills/pr-lifecycle-monitor/reactions');
const {
  createCleanupHandler,
} = require('../skills/pr-lifecycle-monitor/cleanup');

function fakeProcess() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = jest.fn();
  return proc;
}

describe('pr-lifecycle-monitor watcher core', () => {
  test('deduplicates by id + updated_at and treats edits as new', () => {
    const first = { id: 1, updated_at: '2026-11-22T10:00:00Z', body: 'hi' };
    const duplicate = { ...first };
    const edited = { ...first, updated_at: '2026-11-22T10:05:00Z', body: 'hi again' };

    expect(createCommentKey(first)).toBe('1::2026-11-22T10:00:00Z');

    const firstPass = dedupeComments({}, 11, [first, duplicate]);
    expect(firstPass.fresh).toEqual([first]);

    const secondPass = dedupeComments(firstPass.seen, 11, [duplicate]);
    expect(secondPass.fresh).toEqual([]);

    const thirdPass = dedupeComments(secondPass.seen, 11, [edited]);
    expect(thirdPass.fresh).toEqual([edited]);
  });

  test('maps CloudEvents to a tracked PR by number', () => {
    const prs = [{ number: 11, url: 'https://github.com/cgentsis/OpenCodeToolKit/pull/11', branch: 'pr-monitor-idea' }];
    const event = {
      type: 'com.github.pull_request.review.submitted.v1',
      data: { api_url: 'https://api.github.com/repos/cgentsis/OpenCodeToolKit/pulls/11/reviews/42' },
    };

    expect(mapEventToPr(event, prs)).toEqual({
      prNumber: 11,
      type: event.type,
      apiUrl: event.data.api_url,
    });
    expect(mapEventToPr(event, [{ ...prs[0], number: 12 }])).toBeNull();
  });

  test('detects merged and closed PR states', () => {
    expect(isMerged({ state: 'MERGED' })).toBe(true);
    expect(isMerged({ merged: true })).toBe(true);
    expect(isMerged({ merged_at: '2026-11-22T10:00:00Z' })).toBe(true);
    expect(isMerged({ state: 'OPEN' })).toBe(false);

    expect(isClosed({ state: 'CLOSED' })).toBe(true);
    expect(isClosed({ state: 'MERGED' })).toBe(false);
    expect(isClosed({ state: 'OPEN' })).toBe(false);
  });

  test('builds one follow subscription per PR with one-minute poll fallback', () => {
    expect(POLL_INTERVAL_MS).toBe(60000);
    expect(EVENT_TYPES).toContain('com.github.pull_request.review.submitted.v1');
    expect(EVENT_TYPES).toContain('com.github.pull_request.state.changed.v1');

    const pr = { number: 11, url: 'https://github.com/o/r/pull/11' };
    expect(buildListenArgs(pr)).toEqual([
      'event', 'listen',
      '--resource', 'https://github.com/o/r/pull/11',
      '--follow',
      '--event', EVENT_TYPES.join(','),
    ]);
  });

  test('watcher polls tracked PRs, emits fresh comments, and stops cleanly', () => {
    const proc = fakeProcess();
    let timerFn;
    let timerMs;
    const emits = [];
    const activities = [];
    const pr = { number: 11, branch: 'pr-monitor-idea', url: 'https://github.com/o/r/pull/11' };

    const watcher = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => proc),
      fetchPr: jest.fn(async () => ({ state: 'OPEN' })),
      fetchComments: jest.fn(async () => [{ id: 1, updated_at: '2026-11-22T10:00:00Z', body: 'hi' }]),
      onActivity: jest.fn((activity) => activities.push(activity)),
      onMerge: jest.fn(),
      onClose: jest.fn(),
      emit: jest.fn((line) => emits.push(line)),
      intervalMs: 1000,
      setIntervalFn: jest.fn((fn, ms) => { timerFn = fn; timerMs = ms; return 7; }),
      clearIntervalFn: jest.fn(),
    });

    watcher.start();
    expect(watcher.spawn.mock.calls).toHaveLength(1);
    expect(timerMs).toBe(1000);
    expect(watcher.state.seen[11]).toBeUndefined();

    return timerFn().then(() => {
      expect(activities).toHaveLength(1);
      expect(activities[0].pr).toBe(pr);
      expect(activities[0].comment.id).toBe(1);
      expect(watcher.state.seen[11]).toHaveLength(1);
      expect(watcher.fetchPr).toHaveBeenCalledWith(pr);
      expect(watcher.fetchComments).toHaveBeenCalledWith(pr);

      watcher.stop();
      expect(proc.kill).toHaveBeenCalled();
      expect(watcher.clearIntervalFn).toHaveBeenCalledWith(7);
      expect(emits).toContain('monitor stopped');
    });
  });

  test('watcher does not emit the same comment twice across poll and event', async () => {
    const proc = fakeProcess();
    const activities = [];
    const pr = { number: 13, branch: 'dedupe', url: 'https://github.com/o/r/pull/13' };
    const comment = { id: 9, updated_at: '2026-11-22T12:00:00Z', body: 'same' };
    const watcher = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => proc),
      fetchPr: jest.fn(async () => ({ state: 'OPEN' })),
      fetchComments: jest.fn(async () => [comment]),
      onActivity: jest.fn((activity) => activities.push(activity)),
      emit: jest.fn(),
      intervalMs: 1000,
      setIntervalFn: () => 11,
      clearIntervalFn: jest.fn(),
    });

    await watcher.poll();
    await watcher.handleEventLine(JSON.stringify({
      type: 'com.github.pull_request.review.submitted.v1',
      data: { api_url: 'https://api.github.com/repos/o/r/pulls/13/reviews/1' },
    }));

    expect(activities).toHaveLength(1);
    watcher.stop();
  });

  test('abort signal stops the watcher', () => {
    const proc = fakeProcess();
    const controller = new AbortController();
    const pr = { number: 14, branch: 'abort', url: 'https://github.com/o/r/pull/14' };
    const emitted = [];
    const watcher = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => proc),
      fetchPr: jest.fn(async () => ({ state: 'OPEN' })),
      fetchComments: jest.fn(async () => []),
      emit: (line) => emitted.push(line),
      signal: controller.signal,
      intervalMs: 1000,
      setIntervalFn: () => 12,
      clearIntervalFn: jest.fn(),
    });

    watcher.start();
    controller.abort();

    expect(proc.kill).toHaveBeenCalled();
    expect(emitted).toContain('monitor stopped');
  });

  test('watcher delegates detected activity to a reaction layer', async () => {
    const proc = fakeProcess();
    let timerFn;
    const reactionLayer = { handle: jest.fn(async () => ({ status: 'awaiting-approval' })) };
    const pr = { number: 12, branch: 'other', url: 'https://github.com/o/r/pull/12' };

    const watcher = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => proc),
      fetchPr: jest.fn(async () => ({ state: 'OPEN' })),
      fetchComments: jest.fn(async () => [{ id: 2, updated_at: '2026-11-22T11:00:00Z', body: 'please' }]),
      reactionLayer,
      emit: jest.fn(),
      intervalMs: 1000,
      setIntervalFn: jest.fn((fn) => { timerFn = fn; return 9; }),
      clearIntervalFn: jest.fn(),
    });

    watcher.start();
    await timerFn();

    expect(reactionLayer.handle).toHaveBeenCalledTimes(1);
    expect(reactionLayer.handle.mock.calls[0][0].comment.id).toBe(2);
    watcher.stop();
  });
});

describe('pr-lifecycle-monitor reaction layer', () => {
  const activity = {
    pr: { number: 11, branch: 'pr-monitor-idea' },
    comment: {
      id: 1,
      body: 'Please handle the null case.',
      user: { login: 'reviewer' },
    },
    proposedReply: 'Good catch; I will add a guard.',
    codeChangePlan: 'Add a null check in monitor.js.',
    proposedActions: [{ type: 'reply', body: 'Good catch; I will add a guard.' }],
  };

  test('formats a structured approval card', () => {
    const card = formatApprovalCard(activity);
    expect(card).toContain('PR #11');
    expect(card).toContain('reviewer');
    expect(card).toContain('Please handle the null case.');
    expect(card).toContain('Good catch; I will add a guard.');
    expect(card).toContain('Add a null check in monitor.js.');
    expect(card).toContain('Approve, Edit, Skip');
  });

  test('propose mode emits a card and performs no action before approval', async () => {
    const emitted = [];
    const runAction = jest.fn();
    const layer = createReactionLayer({
      mode: 'propose',
      emit: (line) => emitted.push(line),
      runAction,
      audit: (line) => emitted.push(line),
    });

    const result = await layer.handle(activity);

    expect(result.status).toBe('awaiting-approval');
    expect(runAction).not.toHaveBeenCalled();
    expect(emitted.join('\n')).toContain('Approve, Edit, Skip');
    expect(emitted.join('\n')).toContain('mode propose');
  });

  test('approved propose-mode actions run with an audit line', async () => {
    const emitted = [];
    const runAction = jest.fn(async () => 'ok');
    const layer = createReactionLayer({
      mode: 'propose',
      emit: () => {},
      runAction,
      audit: (line) => emitted.push(line),
    });

    const result = await layer.handle(activity, { approved: true });

    expect(result.status).toBe('approved');
    expect(runAction).toHaveBeenCalledWith(activity.proposedActions[0], activity);
    expect(emitted.join('\n')).toContain('approved reply PR 11');
  });

  test('full autonomy allows only the bounded action set', async () => {
    expect([...ALLOWED_AUTONOMOUS_ACTIONS].sort()).toEqual(['fix', 'refreshGates', 'reply']);

    const runAction = jest.fn(async () => 'ok');
    const runGates = jest.fn(async () => 'gates ok');
    const layer = createReactionLayer({
      mode: 'full',
      runAction,
      runGates,
    });

    const result = await layer.handle({
      ...activity,
      proposedActions: [
        { type: 'reply', body: 'ok' },
        { type: 'fix', plan: 'guard' },
        { type: 'refreshGates' },
      ],
    });

    expect(result.status).toBe('autonomous');
    expect(runAction).toHaveBeenCalledTimes(2);
    expect(runGates).toHaveBeenCalledTimes(2);
  });

  test('full autonomy never merges or deletes a remote branch', async () => {
    const runAction = jest.fn(async () => 'ok');
    const layer = createReactionLayer({ mode: 'full', runAction });

    await expect(layer.handle({
      ...activity,
      proposedActions: [{ type: 'merge' }],
    })).rejects.toThrow('action type merge is not permitted');

    await expect(layer.handle({
      ...activity,
      proposedActions: [{ type: 'deleteRemoteBranch' }],
    })).rejects.toThrow('action type deleteRemoteBranch is not permitted');

    expect(runAction).not.toHaveBeenCalled();
  });
});

describe('pr-lifecycle-monitor merge cleanup', () => {
  const pr = { number: 11, branch: 'pr-monitor-idea', url: 'https://github.com/o/r/pull/11' };

  test('verifies merged state before calling finish-worktree once', async () => {
    const emitted = [];
    const verifyPr = jest.fn(async () => ({ state: 'MERGED', merged_at: '2026-11-22T12:00:00Z' }));
    const runFinish = jest.fn(async () => 'cleaned');
    const handler = createCleanupHandler({
      verifyPr,
      runFinish,
      emit: (line) => emitted.push(line),
    });

    await handler.handleMerged({ state: 'MERGED' }, pr);
    await handler.handleMerged({ state: 'MERGED' }, pr);

    expect(verifyPr).toHaveBeenCalledTimes(1);
    expect(runFinish).toHaveBeenCalledTimes(1);
    expect(runFinish).toHaveBeenCalledWith('pr-monitor-idea', pr);
    expect(emitted).toContain('pr 11 cleanup complete');
  });

  test('does not clean up when verification no longer reports merged', async () => {
    const runFinish = jest.fn(async () => 'cleaned');
    const handler = createCleanupHandler({
      verifyPr: jest.fn(async () => ({ state: 'OPEN' })),
      runFinish,
    });

    const result = await handler.handleMerged({ state: 'MERGED' }, pr);

    expect(result.status).toBe('unverified');
    expect(runFinish).not.toHaveBeenCalled();
  });

  test('stops watching a closed PR without cleanup', async () => {
    const emitted = [];
    const runFinish = jest.fn(async () => 'cleaned');
    const handler = createCleanupHandler({
      verifyPr: jest.fn(async () => ({ state: 'CLOSED' })),
      runFinish,
      emit: (line) => emitted.push(line),
    });

    const result = await handler.handleClosed({ state: 'CLOSED' }, pr);

    expect(result.status).toBe('closed');
    expect(runFinish).not.toHaveBeenCalled();
    expect(emitted).toContain('pr 11 closed without merge');
  });

  test('watcher uses cleanup handler for merged and closed transitions', async () => {
    const proc = fakeProcess();
    const handler = {
      handleMerged: jest.fn(async () => 'cleaned'),
      handleClosed: jest.fn(async () => 'closed'),
    };
    let fetchState = { state: 'MERGED' };
    const watcher = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => proc),
      fetchPr: jest.fn(async () => fetchState),
      fetchComments: jest.fn(async () => []),
      onMerge: handler.handleMerged,
      onClose: handler.handleClosed,
      emit: jest.fn(),
      intervalMs: 1000,
      setIntervalFn: () => 3,
      clearIntervalFn: jest.fn(),
    });

    await watcher.poll();
    expect(handler.handleMerged).toHaveBeenCalledTimes(1);

    fetchState = { state: 'CLOSED' };
    const second = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => fakeProcess()),
      fetchPr: jest.fn(async () => fetchState),
      fetchComments: jest.fn(async () => []),
      onMerge: handler.handleMerged,
      onClose: handler.handleClosed,
      emit: jest.fn(),
      intervalMs: 1000,
      setIntervalFn: () => 4,
      clearIntervalFn: jest.fn(),
    });
    await second.poll();
    expect(handler.handleClosed).toHaveBeenCalledTimes(1);
  });

  test('watcher delegates merge transitions to an injected cleanup handler', async () => {
    const cleanupHandler = {
      handleMerged: jest.fn(async () => ({ status: 'cleaned' })),
      handleClosed: jest.fn(async () => ({ status: 'closed' })),
    };
    const watcher = createWatcher({
      prs: [pr],
      spawn: jest.fn(() => fakeProcess()),
      fetchPr: jest.fn(async () => ({ state: 'MERGED' })),
      fetchComments: jest.fn(async () => []),
      cleanupHandler,
      emit: jest.fn(),
      intervalMs: 1000,
      setIntervalFn: () => 5,
      clearIntervalFn: jest.fn(),
    });

    await watcher.poll();

    expect(cleanupHandler.handleMerged).toHaveBeenCalledTimes(1);
    expect(cleanupHandler.handleMerged.mock.calls[0][1]).toBe(pr);
  });
});
