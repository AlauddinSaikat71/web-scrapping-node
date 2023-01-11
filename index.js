import * as cheerio from "cheerio";
import * as fs from 'fs';
import fetch from "node-fetch";
import { Otomoto } from "./models/otomoto.class.js";
import { Page } from "./models/page.class.js";
import { TruckItem } from "./models/truck-item.class.js";

const INITIAL_URL =
  'https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-+2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at+%3Adesc';
const writeStream = fs.createWriteStream('latest-output.json');


async function scrape(currentPageUrl) {
  const response = await fetch(currentPageUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    return $;
}

export async function getNextPageUrl($, currentPageUrl) {
  try {
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

export async function getTotalAdsCount($){
  try {
    //match the add count from the text in h1
    const totalAds = $("h1").text().match(/[0-9]+/)[0];

    return totalAds;
  } catch (error) {
    console.log(error);
  }
}

export async function scrapeTruckItem(actualAdUrl){
  try {
    const $ = await scrape(actualAdUrl);
    const truckItem = new TruckItem();

    truckItem.id = $("span#ad_id.offer-meta__value").html();
    truckItem.title = $("span.offer-title.big-text.fake-title:last").text().trim();
    truckItem.price = $("span.offer-price__number:only-child").text().trim();
    truckItem.registration_date = $("#parameters > ul:nth-child(2) > li:contains('Pierwsza rejestracja') > div").text().trim();
    truckItem.production_date = $("#parameters > ul:nth-child(1) > li:contains('Rok produkcji') > div").text().trim();
    truckItem.power = $("#parameters > ul:nth-child(1) > li:contains('Moc') > div").text().trim();
    truckItem.mileage = $("#parameters > ul:nth-child(1) > li:contains('Przebieg') > div").text().trim();

    return truckItem;
  } catch (error) {
    
  } 
}

export async function addItems($){
  try {
    const ads = $("main > article > div > h2 > a");
   
    const itemUrls = [];
    const trucks = [];
    
    await Promise.all(ads.map(async (i,el) => {
      const url = $(el).attr('href');
      itemUrls.push(url);

      const truck = await scrapeTruckItem(url);
      trucks.push(truck);
      })
    );
    
    return { itemUrls , trucks };
  } catch (error) {
    console.log(error);
  }
}

async function scrapeOtomoto(initialUrl){
  const initialPageCheerio = await scrape(initialUrl);
  
  const totalAds = await getTotalAdsCount(initialPageCheerio);
  const totalPages = Math.ceil(totalAds / 32);

  const otomoto = new Otomoto();
  otomoto.total_ads = totalAds;
  let currentPageUrl = initialUrl;

  for(let  i=1 ; i<=totalPages ; i++){
    const $ = await scrape(currentPageUrl);
    
    const items = await addItems($);
    const page = new Page(currentPageUrl, items.itemUrls, items.trucks);

    if(i < totalPages){
      page.next_page_url = await getNextPageUrl($, currentPageUrl);
    }

    currentPageUrl= page.next_page_url;
    otomoto.pages.push(page);
  }
  writeStream.write(JSON.stringify(otomoto));

  console.log(`Scrapping done.\nTo see the result please open '${writeStream.path}' file from root directory.`);
}

await scrapeOtomoto(INITIAL_URL);

