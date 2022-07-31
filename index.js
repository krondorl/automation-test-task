const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const pathToExtension = require('path').join(__dirname, 'abp_3.4.3');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  });
  const page = await browser.newPage();

  // Wait for loading ABP
  await page.waitFor(5000);

  await page.goto('https://edition.cnn.com/2015/07/31/world/mh370-debris-investigation/index.html');
  await page.setViewport({
    width: 1200,
    height: 1200
  });

  // Scroll down and up to trigger loading of ad tiles
  await autoScroll(page);
  await page.waitFor(5000);
  await scrollTop(page);
  await page.waitFor(250);

  // Get data of all paid tiles
  const allTiles = await page.$$('[onmousedown*="paid.outbrain.com"]');
  console.log('All tiles');
  let tilesArray = [];
  for (let i = 0; i < allTiles.length; i++) {
    const img = await allTiles[i].boundingBox();
    tilesArray.push(img);
  }

  // Save tiles data to file
  if (tilesArray.length > 0) {
    let tilesObject = {tilesArray};
    let json = JSON.stringify(tilesObject);

    fs.writeFile('tiles.json', json, 'utf8', (err) => {
      if (err) {
        throw err;
      }

      console.log('Tiles data has been saved!');
    });
  }

  // Make a screenshot
  await page.screenshot({
    path: 'screenshot.png',
    fullPage: true
  });

  await browser.close();
})();

// based on
// https://stackoverflow.com/questions/51529332/puppeteer-scroll-down-until-you-cant-anymore
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function scrollTop(page) {
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
  });
}
