#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';
import * as readline from 'node:readline';
import { Daemon } from './daemon.js';

// ── Config store ────────────────────────────────────────────────
export interface AgentConfig {
  serverUrl: string;
  agentId: string;
  apiKey: string;
}

const config = new Conf<AgentConfig>({
  projectName: 'deskport-agent',
  schema: {
    serverUrl: { type: 'string', default: '' },
    agentId: { type: 'string', default: '' },
    apiKey: { type: 'string', default: '' },
  },
});

// ── Helpers ─────────────────────────────────────────────────────
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function requireConfig(): AgentConfig {
  const serverUrl = config.get('serverUrl');
  const agentId = config.get('agentId');
  const apiKey = config.get('apiKey');

  if (!serverUrl || !agentId || !apiKey) {
    console.error(chalk.red('Agent not configured. Run `deskport login` first.'));
    process.exit(1);
  }

  return { serverUrl, agentId, apiKey };
}

// PID file path for daemon tracking
const PID_KEY = '__daemonPid';

// ── CLI ─────────────────────────────────────────────────────────
const program = new Command();

program
  .name('deskport')
  .description('DeskPort Agent — secure CLI tool sharing')
  .version('0.1.0');

// ── login ───────────────────────────────────────────────────────
program
  .command('login')
  .description('Configure the agent with server URL and API key')
  .action(async () => {
    console.log(chalk.bold('\nDeskPort Agent Configuration\n'));

    const serverUrl = await prompt(chalk.cyan('Server URL (e.g. wss://cloud.deskport.io): '));
    if (!serverUrl) {
      console.error(chalk.red('Server URL is required.'));
      process.exit(1);
    }

    const agentId = await prompt(chalk.cyan('Agent ID: '));
    if (!agentId) {
      console.error(chalk.red('Agent ID is required.'));
      process.exit(1);
    }

    const apiKey = await prompt(chalk.cyan('API Key: '));
    if (!apiKey) {
      console.error(chalk.red('API Key is required.'));
      process.exit(1);
    }

    config.set('serverUrl', serverUrl);
    config.set('agentId', agentId);
    config.set('apiKey', apiKey);

    console.log(chalk.green('\nConfiguration saved successfully.'));
    console.log(chalk.dim(`Config file: ${config.path}`));
  });

// ── start ───────────────────────────────────────────────────────
program
  .command('start')
  .description('Start the DeskPort agent daemon (foreground)')
  .action(async () => {
    const agentConfig = requireConfig();

    // Check if already running
    const existingPid = config.get(PID_KEY as keyof AgentConfig) as unknown as number | undefined;
    if (existingPid) {
      try {
        process.kill(existingPid, 0);
        console.error(chalk.yellow(`Agent already running (PID ${existingPid}). Use \`deskport stop\` first.`));
        process.exit(1);
      } catch {
        // Process not running, clear stale PID
        config.delete(PID_KEY as keyof AgentConfig);
      }
    }

    const spinner = ora('Starting DeskPort agent...').start();

    const daemon = new Daemon(agentConfig);

    // Store PID
    (config as any).set(PID_KEY, process.pid);

    // Graceful shutdown
    const shutdown = async () => {
      spinner.stop();
      console.log(chalk.yellow('\nShutting down agent...'));
      await daemon.stop();
      config.delete(PID_KEY as keyof AgentConfig);
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    try {
      await daemon.start();
      spinner.succeed(chalk.green('DeskPort agent started'));
      console.log(chalk.dim(`PID: ${process.pid}`));
      console.log(chalk.dim('Press Ctrl+C to stop\n'));
    } catch (err) {
      spinner.fail(chalk.red('Failed to start agent'));
      console.error(err);
      config.delete(PID_KEY as keyof AgentConfig);
      process.exit(1);
    }
  });

// ── stop ────────────────────────────────────────────────────────
program
  .command('stop')
  .description('Stop the running DeskPort agent daemon')
  .action(() => {
    const pid = config.get(PID_KEY as keyof AgentConfig) as unknown as number | undefined;

    if (!pid) {
      console.log(chalk.yellow('No running agent found.'));
      process.exit(0);
    }

    try {
      process.kill(pid, 0); // Check if process exists
      process.kill(pid, 'SIGTERM');
      config.delete(PID_KEY as keyof AgentConfig);
      console.log(chalk.green(`Agent stopped (PID ${pid}).`));
    } catch {
      config.delete(PID_KEY as keyof AgentConfig);
      console.log(chalk.yellow('Agent was not running. Cleared stale PID.'));
    }
  });

// ── status ──────────────────────────────────────────────────────
program
  .command('status')
  .description('Show agent status and active sessions')
  .action(async () => {
    const serverUrl = config.get('serverUrl');
    const agentId = config.get('agentId');

    if (!serverUrl || !agentId) {
      console.log(chalk.yellow('Agent not configured. Run `deskport login` first.'));
      process.exit(0);
    }

    console.log(chalk.bold('\nDeskPort Agent Status\n'));
    console.log(`  Server:    ${chalk.cyan(serverUrl)}`);
    console.log(`  Agent ID:  ${chalk.cyan(agentId)}`);
    console.log(`  Config:    ${chalk.dim(config.path)}`);

    const pid = config.get(PID_KEY as keyof AgentConfig) as unknown as number | undefined;
    if (pid) {
      try {
        process.kill(pid, 0);
        console.log(`  Status:    ${chalk.green('running')} (PID ${pid})`);
      } catch {
        config.delete(PID_KEY as keyof AgentConfig);
        console.log(`  Status:    ${chalk.red('stopped')} (stale PID cleared)`);
      }
    } else {
      console.log(`  Status:    ${chalk.red('stopped')}`);
    }

    // Show tmux sessions if available
    try {
      const { execSync } = await import('node:child_process');
      const output = execSync('tmux list-sessions -F "#{session_name}" 2>/dev/null', {
        encoding: 'utf-8',
      });
      const deskportSessions = output
        .split('\n')
        .filter((s) => s.startsWith('deskport-'))
        .map((s) => s.trim())
        .filter(Boolean);

      if (deskportSessions.length > 0) {
        console.log(`\n  ${chalk.bold('Active Sessions:')}`);
        for (const session of deskportSessions) {
          console.log(`    - ${chalk.cyan(session)}`);
        }
      } else {
        console.log(`\n  ${chalk.dim('No active sessions.')}`);
      }
    } catch {
      console.log(`\n  ${chalk.dim('No active sessions (tmux not available).')}`);
    }

    console.log('');
  });

program.parse();
