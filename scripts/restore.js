import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import AdmZip from 'adm-zip';
import createBackup from './backup.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function restore() {
  const pagesDir = path.join(__dirname, '../pages');
  const backupsDir = path.join(__dirname, '../backups');

  if (!await fs.exists(backupsDir)) {
    console.log('❌ No backups directory found.');
    return;
  }

  const files = await fs.readdir(backupsDir);
  const zipFiles = files
    .filter(f => f.endsWith('.zip'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(backupsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (zipFiles.length === 0) {
    console.log('❌ No backup files found in backups/ directory.');
    return;
  }

  const { selectedBackup } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedBackup',
      message: 'Select a backup to restore:',
      choices: zipFiles.map(f => ({
        name: `${f.name} (${new Date(f.time).toLocaleString()})`,
        value: f.name
      }))
    }
  ]);

  const { backupFirst } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'backupFirst',
      message: 'Would you like to backup the current pages directory before restoring?',
      default: true
    }
  ]);

  if (backupFirst) {
    console.log('📦 Creating pre-restoration backup...');
    await createBackup(true);
  }

  const { confirmRestore } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmRestore',
      message: `Are you sure you want to restore ${selectedBackup}? This will overwrite current pages!`,
      default: false
    }
  ]);

  if (!confirmRestore) {
    console.log('🚫 Restoration cancelled.');
    return;
  }

  console.log(`🚀 Restoring ${selectedBackup}...`);

  // Clear current pages
  await fs.emptyDir(pagesDir);
  
  const zip = new AdmZip(path.join(backupsDir, selectedBackup));
  zip.extractAllTo(pagesDir, true);

  // Ensure .keep exists to keep git happy
  const keepFile = path.join(pagesDir, '.keep');
  if (!await fs.exists(keepFile)) {
    await fs.writeFile(keepFile, '');
  }

  console.log('✨ Restoration complete!');
}

if (process.argv[1] === __filename) {
  restore().catch(err => {
    console.error('❌ Restoration failed:', err);
    process.exit(1);
  });
}

export default restore;
