import fs from 'node:fs/promises';
import path from 'node:path';
import nunjucks from 'nunjucks';

const ROOT = process.cwd();
const CLIENT_DIR = path.join(ROOT, 'ui', 'client');
const GUARD_DIR = path.join(ROOT, 'ui', 'guard');
const ADMIN_DIR = path.join(ROOT, 'ui', 'admin');
const SITE_DIR = path.join(ROOT, 'ui', 'site');
const ROOT_UI_DIR = path.join(ROOT, 'ui');
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

async function buildAdminPage(templateName, outName) {
  const html = env.render(templateName, {});
  const outPath = path.join(ADMIN_DIR, outName);
  await fs.writeFile(outPath, html, 'utf8');
  console.log(`Built admin/${outName} from ${templateName}`);
}

async function buildSitePage(templateName, outName) {
  const html = env.render(templateName, {});
  const outPath = path.join(SITE_DIR, outName);
  await fs.writeFile(outPath, html, 'utf8');
  console.log(`Built site/${outName} from ${templateName}`);
}

async function buildRootPage(templateName, outName) {
  const html = env.render(templateName, {});
  const outPath = path.join(ROOT_UI_DIR, outName);
  await fs.writeFile(outPath, html, 'utf8');
  console.log(`Built ui/${outName} from ${templateName}`);
}

async function main() {
  const pages = [
    { template: 'pages/dashboard.njk', out: 'dashboard.html' },
    { template: 'pages/bookings.njk', out: 'bookings.html' },
    { template: 'pages/sessions-history.njk', out: 'sessions-history.html' },
    { template: 'pages/contracts.njk', out: 'contracts.html' },
    { template: 'pages/contracts-create.njk', out: 'contracts-create.html' },
    { template: 'pages/vehicles.njk', out: 'vehicles.html' },
    { template: 'pages/payment-settings.njk', out: 'payment-settings.html' },
    { template: 'pages/payment-external.njk', out: 'payment-external.html' },
    { template: 'pages/appeals.njk', out: 'appeals.html' },
    { template: 'pages/notifications.njk', out: 'notifications.html' },
    { template: 'pages/profile.njk', out: 'profile.html' },
  ];

  const guardPages = [
    { template: 'pages/guard-dashboard.njk', out: 'index.html' },
    { template: 'pages/guard-log.njk', out: 'log.html' },
    { template: 'pages/guard-client-summary.njk', out: 'client-summary.html' },
    { template: 'pages/guard-profile.njk', out: 'profile.html' },
    { template: 'pages/guard-plate-history.njk', out: 'plate-history.html' },
    { template: 'pages/guard-notifications.njk', out: 'notifications.html' },
  ];

  const adminPages = [
    { template: 'pages/admin-index.njk', out: 'index.html' },
    { template: 'pages/admin-profile.njk', out: 'profile.html' },
    { template: 'pages/admin-sectors.njk', out: 'sectors.html' },
    { template: 'pages/admin-tariffs.njk', out: 'tariffs.html' },
    { template: 'pages/admin-contracts.njk', out: 'contracts.html' },
    { template: 'pages/admin-contracts-create.njk', out: 'contracts-create.html' },
    { template: 'pages/admin-bookings.njk', out: 'bookings.html' },
    { template: 'pages/admin-clients.njk', out: 'clients.html' },
    { template: 'pages/admin-admins.njk', out: 'admins.html' },
    { template: 'pages/admin-debts.njk', out: 'debts.html' },
    { template: 'pages/admin-notifications.njk', out: 'notifications.html' },
    { template: 'pages/admin-notifications-manage.njk', out: 'notifications-manage.html' },
    { template: 'pages/admin-requests.njk', out: 'requests.html' },
    { template: 'pages/admin-analytics.njk', out: 'analytics.html' },
    { template: 'pages/admin-client-sessions.njk', out: 'client-sessions.html' },
    { template: 'pages/admin-kpp-dashboard.njk', out: 'kpp-panel.html' },
    { template: 'pages/admin-kpp-log.njk', out: 'kpp-log.html' },
  ];

  const sitePages = [
    { template: 'pages/site-index.njk', out: 'index.html' },
    { template: 'pages/site-tariffs.njk', out: 'tariffs.html' },
    { template: 'pages/site-rules.njk', out: 'rules.html' },
    { template: 'pages/site-contacts.njk', out: 'contacts.html' },
    { template: 'pages/site-register.njk', out: 'register.html' },
    { template: 'pages/site-login.njk', out: 'login.html' },
    { template: 'pages/site-parking-map.njk', out: 'parking-map.html' },
  ];

  const rootPages = [
    { template: 'pages/root-index.njk', out: 'index.html' },
  ];

  for (const page of pages) {
    await buildClientPage(page.template, page.out);
  }

  for (const page of guardPages) {
    await buildGuardPage(page.template, page.out);
  }

  for (const page of adminPages) {
    await buildAdminPage(page.template, page.out);
  }

  for (const page of sitePages) {
    await buildSitePage(page.template, page.out);
  }

  for (const page of rootPages) {
    await buildRootPage(page.template, page.out);
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

