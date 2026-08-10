const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function htmlToPdf() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const htmlPath = path.join(__dirname, 'presentacion.html');
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForFunction(() => {
        return document.querySelector('.reveal .slides') && document.querySelectorAll('.reveal .slides section').length > 5;
    }, { timeout: 15000 });

    await new Promise(r => setTimeout(r, 3000));

    await page.pdf({
        path: path.join(__dirname, 'SmartValuation_Presentacion.pdf'),
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    console.log('PDF generado: SmartValuation_Presentacion.pdf');
    await browser.close();
}

htmlToPdf().catch(e => console.error(e));
