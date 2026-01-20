const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const inquirer = require('inquirer');

async function createBackup(isAutomatic = false) {
  const pagesDir = path.join(__dirname, '../pages');
  const backupsDir = path.join(__dirname, '../backups');

  await fs.ensureDir(backupsDir);

  let note = '';
  if (!isAutomatic) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'note',
        message: 'Add a note to this backup (optional):',
        default: ''
      }
    ]);
    note = answers.note.trim().replace(/\s+/g, '_');
  } else {
    note = 'pre_restore_backup';
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `backup_${timestamp}${note ? `_${note}` : ''}.zip`;
  const filePath = path.join(backupsDir, fileName);

  const output = fs.createWriteStream(filePath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`\n✅ Backup created successfully: ${fileName}`);
      console.log(`📊 Total bytes: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(filePath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(pagesDir, false);
    archive.finalize();
  });
}

if (require.main === module) {
  createBackup().catch(err => {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  });
}

module.exports = createBackup;
