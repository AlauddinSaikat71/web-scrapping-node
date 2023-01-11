export class Page {
    current_page_url;

    next_page_url;

    item_urls;

    trucks;

    constructor(currentPageUrl, itemUrls, trucks){
        this.current_page_url = currentPageUrl;
        this.item_urls = itemUrls;
        this.trucks = trucks;
    }
}