import { Webapp1Page } from './app.po';

describe('webapp1 App', function() {
  let page: Webapp1Page;

  beforeEach(() => {
    page = new Webapp1Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
