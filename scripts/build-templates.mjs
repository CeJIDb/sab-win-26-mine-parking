import fs from 'node:fs/promises';
import path from 'node:path';
import nunjucks from 'nunjucks';

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, 'ui', 'client');
const GUARD_DIR = path.join(ROOT, 'ui', 'guard');
const TEMPLATES_DIR = path.join(ROOT, 'ui', 'templates');

// Настраиваем окружение nunjucks
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader([TEMPLATES_DIR]),
  { autoescape: true }
);

async function buildClientPage(templateName, outName) {
  const html = env.render(templateName, {});
  const outPath = path.join(CLIENT_DIR, outName);
  await fs.writeFile(outPath, html, 'utf8');
  console.log(`Built ${outName} from ${templateName}`);
}

async function buildGuardPage(templateName, outName) {
  const html = env.render(templateName, {});
  const outPath = path.join(GUARD_DIR, outName);
  await fs.writeFile(outPath, html, 'utf8');
  console.log(`Built guard/${outName} from ${templateName}`);
}

async function main() {
  const pages = [
    { template: 'pages/dashboard.njk', out: 'dashboard.html' },
    { template: 'pages/bookings.njk', out: 'bookings.html' },
    { template: 'pages/booking-payment.njk', out: 'booking-payment.html' },
    { template: 'pages/sessions-history.njk', out: 'sessions-history.html' },
    { template: 'pages/contracts.njk', out: 'contracts.html' },
    { template: 'pages/contracts-create.njk', out: 'contracts-create.html' },
    { template: 'pages/vehicles.njk', out: 'vehicles.html' },
    { template: 'pages/payment-settings.njk', out: 'payment-settings.html' },
    { template: 'pages/appeals.njk', out: 'appeals.html' },
    { template: 'pages/notifications.njk', out: 'notifications.html' },
    { template: 'pages/profile.njk', out: 'profile.html' },
  ];

  const guardPages = [
    { template: 'pages/guard-dashboard.njk', out: 'index.html' },
    { template: 'pages/guard-log.njk', out: 'log.html' },
    { template: 'pages/guard-client-summary.njk', out: 'client-summary.html' },
  ];

  for (const page of pages) {
    await buildClientPage(page.template, page.out);
  }

  for (const page of guardPages) {
    await buildGuardPage(page.template, page.out);
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

