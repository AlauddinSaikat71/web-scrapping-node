import * as cheerio from "cheerio";
import fetch from "node-fetch";

const INITIAL_URL =
  'https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-+2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at+%3Adesc';

async function scrape(currentPageUrl) {
  const response = await fetch(currentPageUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    return $;
}

export async function getNextPageUrl(currentPageUrl) {
  try {
    const $ = await scrape(currentPageUrl);

    const paginationItemActive = $(
      ".pagination-item__active"
    );
    const currentPageNumber = Number(paginationItemActive.find("span").text());
    const nextPageNumber = String(currentPageNumber + 1) ;
    let nextPageUrl;

    const pageParam = '&page=';
    const pageParamRegex = /&page=[0-9]+/;
      if(currentPageUrl.includes(pageParam)) {
          nextPageUrl = currentPageUrl.replace(pageParamRegex,'');
          nextPageUrl = nextPageUrl.concat( pageParam , nextPageNumber );
        }
        else {
          nextPageUrl = currentPageUrl.concat(pageParam , nextPageNumber );
        }
        
    return nextPageUrl;
  } catch (error) {
    console.log(error);
  }
}

export async function getTotalAdsCount(currentPageUrl){
  try {
    const $ = await scrape(currentPageUrl);
    
    //match the add count from the text in h1
    const totalAds = $("h1").text().match(/[0-9]+/)[0];

    return totalAds ;
  } catch (error) {
    console.log(error);
  }
}

export async function addItems(currentPageUrl){
  try {
    const $ = await scrape(currentPageUrl);
    
    const ads = $("main > article > div > h2 > a");
    
    const links = [];
    ads.each((i,el) => {
      links.push($(el).attr('href')) ;
    })

    return links;
  } catch (error) {
    console.log(error);
  }
}

export async function scrapeTruckItem(currentPageUrl){

}

//scrapeTruckItem(INITIAL_URL);
//addItems(INITIAL_URL);
//getTotalAdsCount(INITIAL_URL)
//getNextPageUrl(INITIAL_URL);
