export class Page {
    current_page_url;

    next_page_url;

    item_urls;

    trucks;

    constructor(currentPageUrl){
        this.current_page_url = currentPageUrl;
    }
}