const { parentPort, workerData } = require('worker_threads');

// Perform some time-consuming task or operations here

// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// add Stealth
puppeteer.use(StealthPlugin());
// add iframe cracker
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
// delay some time
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const timeoutInMilliseconds = 1000000;
// wait for iframe
async function iframeAttached(page, url, num) {
  return new Promise(async resolve => {
    const pollingInterval = 1000;
    const poll = setInterval(async function waitForIFrameToLoad() {
      const iFrame = page.frames()
      const count = iFrame.reduce((acc, el) => el.url().includes(url) ? acc + 1 : acc, 0);
      if (count >= num) {
        clearInterval(poll);
        resolve(iFrame);
      }
    }, pollingInterval);
  });
}

async function createAndGetApiKey(headless, index) {
  const startTime = process.hrtime();
  const options = {
    headless: headless || false,
    devtools: false,
    args: [
      // '--remote-debugging-port=9222',
      // '--remote-debugging-address=0.0.0.0',
      '--no-sandbox'
    ],
    timeout: timeoutInMilliseconds,
  };
  //// Create Browser
  const browser = await puppeteer.launch(options);
  //// Open new Chrome Windows Tab: app.reversecontact.com
  // const pages = await browser.pages();
  // const reverseContactPage = pages[0];
  const reverseContactPage = await browser.newPage();
  // await reverseContactPage.setDefaultNavigationTimeout(timeoutInMilliseconds);
  await reverseContactPage.goto('https://app.reversecontact.com/register', { timeout: timeoutInMilliseconds });

  // //// Open new Chrome Windows Tab: www.minuteinbox.com
  // const minuteInboxPage = await browser.newPage();
  // await minuteInboxPage.goto('https://www.minuteinbox.com/');
  // //// get new email from www.minuteinbox.com
  // const f = await minuteInboxPage.$("#email");
  // const n = await (await f.getProperty('textContent')).jsonValue();
  // console.log(n);
  const generatorEmailPage = await browser.newPage();
  await generatorEmailPage.goto('https://generator.email/', { timeout: timeoutInMilliseconds });
  await generatorEmailPage.waitForSelector('label[for="toggler-1"]', { timeout: timeoutInMilliseconds });
  await generatorEmailPage.click('label[for="toggler-1"]');
  await generatorEmailPage.waitForSelector('label[for="toggler-2"]', { timeout: timeoutInMilliseconds });
  await generatorEmailPage.click('label[for="toggler-2"]');
  const generateButtonInnerText = 'Generate new e-mail';
  const generateButtonXPath = `//button[contains(text(), '${generateButtonInnerText}')]`;
  await generatorEmailPage.waitForXPath(generateButtonXPath, { timeout: timeoutInMilliseconds });
  const [generateButtonElement] = await generatorEmailPage.$x(generateButtonXPath);
  await generateButtonElement.click();
  const elementId = 'email_ch_text';
  await generatorEmailPage.waitForSelector(`#${elementId}`, { timeout: timeoutInMilliseconds });
  const elementHandle = await generatorEmailPage.$(`#${elementId}`);
  const email = await elementHandle.evaluate(element => element.innerText);
  console.log(`------------Worker ${index + 1} ---------------------`);
  console.log(`Get login email: ${email}`);
  console.log(`------------------------------------------`);
  // process.exit(0);

  //// Run the Resister Process on app.reversecontact.com
  await reverseContactPage.bringToFront();
  const inputSelector = '#email';
  const stringToInput = email;
  await reverseContactPage.waitForSelector(`${inputSelector}`, { timeout: timeoutInMilliseconds });
  await reverseContactPage.type(inputSelector, stringToInput);
  const checkboxSelector = '#tos';
  await reverseContactPage.waitForSelector(`${checkboxSelector}`, { timeout: timeoutInMilliseconds });
  await reverseContactPage.click(checkboxSelector);

  // Find the button by its inner text using XPath
  const buttonText = 'Get started';
  const buttonXPath = `//button[contains(text(), "${buttonText}")]`;
  await reverseContactPage.waitForXPath(buttonXPath);
  const [buttonElement] = await reverseContactPage.$x(buttonXPath);
  await buttonElement.click();
  //// Get verify-code from VERIFY MODAL on app.reversecontact.com
  await reverseContactPage.waitForSelector('iframe.magic-iframe', { timeout: timeoutInMilliseconds });
  await iframeAttached(reverseContactPage, "https://auth.magic.link/send?params=", 1);
  const frameHandle = await reverseContactPage.$('iframe.magic-iframe');
  const frame = await frameHandle.contentFrame();
  const t = await frame.waitForSelector('.fontMonospace', { timeout: timeoutInMilliseconds });
  const verifyCode = await (await t.getProperty('textContent')).jsonValue();
  console.log(`------------Worker ${index + 1} ---------------------`);
  console.log(`Get verifyCode: ${verifyCode}`);
  console.log(`------------------------------------------`);

  //// Check verify email on generator.email
  await generatorEmailPage.bringToFront();

  while (!await generatorEmailPage.url().includes('https://generator.email/inbox')) {
    await generatorEmailPage.reload({ timeout: timeoutInMilliseconds });
  }

  await generatorEmailPage.waitForSelector('.login-button', { timeout: timeoutInMilliseconds });
  // await generatorEmailPage.click(".login-button");

  const href = await generatorEmailPage.evaluate(() => {
    const element = document.querySelector('.login-button'); // CSS selector targeting the element by class
    return element ? element.href : null;
  });
  const authPage = await browser.newPage();
  await authPage.goto(href, { timeout: timeoutInMilliseconds });

  // while (true) { await delay(100000); }
  // //// Check verify email on www.minuteinbox.com
  // await minuteInboxPage.bringToFront();
  // await minuteInboxPage.waitForFunction(
  //   `Array.from(document.querySelectorAll('td'))
  //     .some(element => element.innerText.includes('Log in to Reverse Contact'))`,
  //   { timeout: 50000 }
  // ).catch(() => false);
  // await minuteInboxPage.evaluate(() => {
  //   x = document.querySelectorAll("td.from")[0];
  //   console.log(x.textContent);
  //   if (x.textContent.includes("Login")) x.click();
  // });

  // await minuteInboxPage.goto("https://www.minuteinbox.com/email/id/2");
  // await minuteInboxPage.waitForSelector(".login-button");
  // const loginButton = await minuteInboxPage.$('.login-button');
  // await loginButton.click();

  // //// Open new Chrome Windows Tab: verifyTab
  // // Wait for the new tab to open and get its target
  // const newTarget = await browser.waitForTarget(target => target.opener() === generatorEmailPage.target(), { timeout: timeoutInMilliseconds });
  // const authPage = await newTarget.page();
  // // console.log(newPage.url());
  await authPage.waitForSelector("._U", { timeout: timeoutInMilliseconds });

  for (const digit of verifyCode) {
    await authPage.keyboard.press(`Digit${digit}`);
  }
  // console.log(2);
  console.log(`------------Worker ${index + 1} ---------------------`);
  console.log(`Typed the verifyCode!: ${`Success`}`);
  console.log(`------------------------------------------`);

  //// Wait for Verify
  await reverseContactPage.bringToFront();
  const targetUrl = "https://app.reversecontact.com/search";
  await reverseContactPage.waitForFunction(
    `window.location.href === '${targetUrl}'`,
    { timeout: timeoutInMilliseconds }
  );

  //// Close some tabs: generatorEmailPage, newPage
  // await minuteInboxPage.close();
  await generatorEmailPage.close();
  await authPage.close();
  // console.log(3);
  //// Go to API page on app.reversecontact.com
  await reverseContactPage.goto("https://app.reversecontact.com/api", { timeout: timeoutInMilliseconds });
  const targetId = "app";
  const targetSelector = `#${targetId}`; // CSS selector to match the element by ID

  await reverseContactPage.waitForSelector(targetSelector, { timeout: timeoutInMilliseconds });
  await reverseContactPage.click(targetSelector);

  const targetText = 'Get my API key'; // Replace with the text of the element you want to click

  const targetXPath = `//span[contains(text(), "${targetText}")]`; // XPath to match the desired text

  await reverseContactPage.waitForXPath(targetXPath, { timeout: timeoutInMilliseconds });
  const [targetElement] = await reverseContactPage.$x(targetXPath);

  await targetElement.click();
  //// get the new API KEY from app.reversecontact.com
  const keySelector = '#input-85'; // Replace with the selector of the input element

  await reverseContactPage.waitForSelector(keySelector, { timeout: timeoutInMilliseconds });
  var API_KEY;
  while (true) {
    const inputValue = await reverseContactPage.evaluate((selector) => {
      const inputElement = document.querySelector(selector);
      // console.log(inputElement.value);
      return inputElement.value;
    }, keySelector);
    // console.log('Input value:', inputValue);
    if (inputValue.includes("sk_live")) {
      API_KEY = inputValue;
      break;
    }
    await delay(1000);
  }
  // console.log(API_KEY);
  console.log(`------------Worker ${index + 1} ---------------------`);
  console.log(`Get API KEY!: ${API_KEY}`);
  console.log(`------------------------------------------`);

  await browser.close();
  //// measure Elapsed Time of 
  const endTime = process.hrtime(startTime);
  const elapsedTimeInSeconds = endTime[0] + endTime[1] / 1e9;
  const minutes = Math.floor(elapsedTimeInSeconds / 60);
  const seconds = Math.floor(elapsedTimeInSeconds % 60);
  const milliseconds = Math.floor((elapsedTimeInSeconds % 1) * 1000);
  console.log(`------------Worker ${index + 1} ---------------------`);
  console.log(`Elapsed time: ${minutes} minutes ${seconds} seconds ${milliseconds} milliseconds`);
  console.log(`------------------------------------------`);
  // Send a message back to the main thread
  parentPort.postMessage(API_KEY);

}





// Listen for messages from the main thread
parentPort.on('message', async (message) => {
  // console.log(message);
  const { addCredits, getTotalCredits } = require("./api-request.js");
  const HEADLESS = message.config.HEADLESS;
  const index = message.index;
  const MIN_NUM_OF_AVAILABLE_CREDITS = message.config.MIN_NUM_OF_AVAILABLE_CREDITS;
  // 
  while (true) {
    try {
      const totalCredits = await getTotalCredits();
      if (totalCredits < MIN_NUM_OF_AVAILABLE_CREDITS) {
        console.log(`Total Number of Credits: ${totalCredits}! Not enough ... Need to create!`);
        await createAndGetApiKey(HEADLESS, index);
      } else {
        console.log(`Total Number of Credits: ${totalCredits}! Enough ... No need to create!`);
        await delay(10000);
      }
    }
    catch (error) {
      console.error('Error occurred:', error);

      // Extract the file path
      const filePath = __filename;

      // Extract the line number from the error stack trace
      const errorLine = error.stack.split('\n')[1];

      console.log('Error occurred in file:', filePath);
      console.log('Error occurred at:', errorLine);
    }

  }
});

module.exports = {
  createAndGetApiKey
};