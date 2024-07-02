import {browser} from 'nightwatch';

describe("Nightwatch demo test", () => {
  before(async function () {
    // navigate to baseUrl
    await browser.navigateTo("/");
  });

  it("should have correct title", async function () {
    // assert the title
    const title = await browser.getTitle();
    browser.assert.equal(title, "Welcome to Qwik");

    // other way of asserting on title
    browser.assert.titleContains("Qwik");
  });

  it("test the working of counter", async () => {
    // find element by text using xpath
    const countUpButton = browser.element.find(by.xpath('//*[text()="+"]'));

    // another better way to find element by text
    const countDownButton = browser.element.findByText("-");

    // get the counter element (next sibling of the `-` element)
    const counterElement = countDownButton.getNextElementSibling();

    // assert the current value of the counter
    counterElement.getText().assert.equals("70");

    // click the "+" button 5 times
    for (let i = 0; i < 5; i++) {
      countUpButton.click();
    }

    // uncomment the below line to visualize the change
    // browser.pause(2000);

    // assert the new value of the counter
    counterElement.getText().assert.equals("75");
  });
});
