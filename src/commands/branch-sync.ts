import chalk from 'chalk';
import { Argv } from 'yargs';

import { catchError } from 'lib/error';
import {
	checkGitInstallation,
	getCurrentBranch,
	getGlobalMainBranch,
	getRepoMainBranch,
	getSourceBranchFromBranch
} from 'lib/git';
import { exec } from 'lib/shell';
import log from 'lib/log';

interface CommandArgs {
	from?: string;
	rebase?: boolean;
}

const name = 'branch-sync';
const description = 'Updates current branch with remote changes.';

const config = (yargs: Argv) => {
	// prettier-ignore
	return yargs
		.usage('foxcli branch-sync [options]')
		.version(false)
		.help('help')
		.option('help', {  alias: 'h'})
		.option('from', {
			alias: 'f',
			describe: 'Use custom source branch to sync the current branch from',
			type: 'string'
		})
		.option('rebase', {
			alias: 'r',
			default: false,
			describe: 'Use rebase when syncing',
			type: 'boolean'
		});
};

const handler = (args: CommandArgs) => {
	catchError(async () => {
		checkGitInstallation();

		const currentBranch = getCurrentBranch();
		const sourceBranch = args.from || (await getSourceBranchFromBranch(currentBranch));
		const mainMasterBranch = getRepoMainBranch('master') || getGlobalMainBranch('master');
		const mainDevelopBranch = getRepoMainBranch('develop') || getGlobalMainBranch('develop');
		if ([mainMasterBranch, mainDevelopBranch].includes(currentBranch)) {
			return log.warn(`You are in a source branch: ${chalk.bold.underline(currentBranch)}. Doing nothing.`);
		}

		const params = args.rebase ? '--rebase' : '';
		const { code } = exec(`git pull origin ${sourceBranch} --ff ${params}`);
		if (code) throw { code };
	});
};

export default { config, description, handler, name };
