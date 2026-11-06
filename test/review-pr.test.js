jest.mock('child_process', () => ({
  execSync: jest.fn(() => ''),
}));

const { execSync } = require('child_process');
const { run } = require('../skills/review-and-pr/review-pr');

describe('review-and-PR skill', () => {
  beforeEach(() => {
    execSync.mockClear();
  });

  test('runs without prompting in auto-approve mode', async () => {
    await expect(
      run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' })
    ).resolves.toBeUndefined();

    expect(execSync).toHaveBeenCalled();
  });
});
