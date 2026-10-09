// OpenMensa v2 has no language parameter. Keep provider codes outside translation.
const translations:Record<string,string>={
 '4 Klopse aus Rind- und Schweinefleisch in Kapernsauce':'4 beef and pork meatballs in caper sauce',
 'Grünkernpfanne mit Pilzen, Bohnen und Röstzwiebeln':'Green spelt skillet with mushrooms, beans and fried onions',
 'Okraschoten mit Tomaten':'Okra with tomatoes',
 'Marinierter Obstsalat':'Marinated fruit salad',
 'Vorspeisen':'Starters','Salate':'Salads','Suppen':'Soups','Aktionen':'Specials','Essen':'Main dishes','Beilagen':'Side dishes','Desserts':'Desserts',
 'Linsensuppe':'Lentil soup','Rote Linsensuppe':'Red lentil soup','Soja':'Soy','Mandeln':'Almonds','Sesam':'Sesame','konserviert':'Preserved','Weizen':'Wheat','Eier':'Eggs','Dinkel':'Spelt','Hefe':'Yeast','Sellerie':'Celery','Senf':'Mustard','Kaschunuss':'Cashews','Antioxidationsmittel':'Antioxidants',
 'Milch und Milchprodukte (inkl. Laktose)':'Milk and milk products (including lactose)',
 'Schweinefleisch bzw. mit Gelatine vom Schwein':'Pork or pork gelatine',
 'Vegan:  Gericht ist aus ausschließlich pflanzlichen Rohstoffen zubereitet.':'Vegan: Prepared exclusively with plant-based ingredients.',
 'Vegetarisch:  Gerichte werden ohne Fisch- und Fleischzutaten zubereitet.':'Vegetarian: Prepared without fish or meat ingredients.',
 'Grüner Ampelpunkt:  Die beste Wahl – je öfter, desto besser.':'Green traffic-light rating: The best choice – the more often, the better.',
 'Gelber Ampelpunkt:  Eine gute Wahl – immer mal wieder.':'Yellow traffic-light rating: A good choice from time to time.',
 'Roter Ampelpunkt:  Eher selten – am besten mit Grün kombinieren.':'Red traffic-light rating: Choose less often, preferably combined with green-rated dishes.',
 'Der Wasserverbrauch für dieses Gericht liegt unter dem Durchschnitt aller betrachteten Speisen.':'Water use for this dish is below the average of all assessed dishes.',
 'Der Wasserverbrauch für dieses Gericht ist doppelt so hoch wie der Durchschnitt aller betrachteten Speisen.':'Water use for this dish is twice the average of all assessed dishes.',
 'Der Wasserverbrauch für dieses Gericht ist mehr als doppelt so hoch wie der Durchschnitt aller betrachteten Speisen.':'Water use for this dish is more than twice the average of all assessed dishes.',
 'Dieses Gericht verursacht weniger als halb so viel CO₂ wie der Durchschnitt aller betrachteten Speisen.':'This dish produces less than half the CO₂ of the average of all assessed dishes.',
 'Der CO₂-Wert dieses Gerichtes liegt über dem Durchschnitt aller betrachteten Speisen.':'CO₂ emissions for this dish are above the average of all assessed dishes.'
}
export async function menuEnglish(text:string,signal:AbortSignal):Promise<string>{
 const allergen=text.match(/^(Allergens:\s*)([0-9]+[a-z]?\s+)?(.*)$/)
 if(allergen)return `Allergens: ${allergen[2]||''}${await menuEnglish(allergen[3],signal)}`
 if(translations[text])return translations[text]
 // Public translation service, used only for text not covered by the curated glossary.
 const response=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=de%7Cen`,{signal})
 if(!response.ok)throw new Error('English translation unavailable')
 const data=await response.json()
 const translated=data.responseData?.translatedText
 if(data.responseStatus!==200||data.quotaFinished||typeof translated!=='string'||!translated.trim())throw new Error('English translation unavailable')
 // Decode translation-service HTML entities without injecting markup.
 const decoder=document.createElement('textarea');decoder.innerHTML=translated
 const value=decoder.value.trim();translations[text]=value
 return value
}
