var dbPromise = null; 
var exchangeID = null;
var exchangeTite = '';
var toCurrencyID = '';
var fromCurrencyID = '';
var convertButton = document.getElementById("convert-btn");

window.addEventListener('load', e => {

    dbPromise = idb.open('ConverterDatabase', 1, upgradeDB => {
        upgradeDB.createObjectStore('CurrencyStore',{keyPath : 'id'});        
        upgradeDB.createObjectStore('ExchangeRateStore',{keyPath : 'id'});
    });   
    
    fetchCurrencyDB();

    convertButton.onclick = () => {
        const errorDisplay = document.getElementById("error");
        const fromCurrencyLoad = document.getElementById("from-currency");
        const fromCurrency = fromCurrencyLoad.options[fromCurrencyLoad.selectedIndex].value;
        const toCurrencyLoad = document.getElementById("to-currency");
        const toCurrency = toCurrencyLoad.options[toCurrencyLoad.selectedIndex].value;

        errorDisplay.setAttribute("style", "display:none");
        
        exchangeID = `${fromCurrency}_${toCurrency}`;  
        exchangeTitle = `From ${fromCurrency} > To ${toCurrency}`;  
        toCurrencyID = toCurrency;
        fromCurrencyID = fromCurrency;
        const exchangeAPI = `https://free.currencyconverterapi.com/api/v5/convert?q=${exchangeID}&compact=ultra`;
        const exchangeVal = document.getElementById("amountValue").value;

        if((parseInt(exchangeVal) > 0) && (fromCurrency.length > 0) && (toCurrency.length > 0)){
            const storeName = "ExchangeRateStore";
            dbPromise.then(db => {
                return db.transaction(storeName, 'readwrite')
                       .objectStore(storeName)
                       .get(`${exchangeID}`);            
            }).then(result => {
                
                if(result == null){
                    webResult(exchangeAPI);
                }else{
                    const exchangeValue = document.getElementById("amountValue").value;
                    convertCurrency(result.data, exchangeValue);
                }            
            });        
        }else{
            errorDisplay.setAttribute("style", "display:block");
        }
    }
});

function webResult(exchangeAPI){
    fetch(exchangeAPI)
    .then(response => response.json())
    .then(data => {     
        const exchangeValue = document.getElementById("amountValue").value;
        addExchangeRate(data);
        convertCurrency(data, exchangeValue);
    }).catch((error) => {
        cachedRates();
    });
}

function cachedRates(){
    const storeName = "ExchangeRateStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).get(exchangeID);
        return tx.complete;
    }).then(data => {
        const exchangeValue = document.getElementById("amountValue").value;
        convertCurrency(data, exchangeValue);
    });
}

function convertCurrency(data, exchangeValue){

    let totalAmountConverted = 1;

    for (var prop in data) {
        exchangeRate = data[prop];
        totalAmountConverted = (exchangeValue * exchangeRate).toFixed(2);

        const convertedValueElement = document.getElementById('converted-value');
        const exchangeTitleElement = document.getElementById('exchange-title');
        const exchangeRateElement = document.getElementById('exchange-rate');

        convertedValueElement.innerHTML = `${toCurrencyID} ${totalAmountConverted}`;
        exchangeTitleElement.innerHTML = exchangeTitle;
        exchangeRateElement.innerHTML = `1${fromCurrencyID} = ${toCurrencyID} ${exchangeRate}`;
        break;
    }
}

function appendOption(elementSelector, key, value){
    var options = document.getElementById(elementSelector);
    const newOption = document.createElement('option');
    newOption.value= key;
    newOption.text= value;
    options.appendChild(newOption);
}

function addCurrency(dbPromise,currencyData){
    const storeName = "CurrencyStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName,'readwrite');
        tx.objectStore(storeName).put(currencyData);
        return tx.complete;
    })
}

function addExchangeRate(data){
    const storeName = "ExchangeRateStore";

    dbPromise.then(db => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put({id: exchangeID, data : data});
        return tx.complete;
    })
}

function fetchCurrencyDB(){    
    let dataFound = false;

    dbPromise.then(db => {
        return db.transaction('CurrencyStore')
                 .objectStore('CurrencyStore')
                 .getAll();
    }).then(currencies => {

        for(let currencyData of currencies){
            const optionName = `${currencyData.currencyName} - (${currencyData.id})`;
            const optionValue = currencyData.id;
           
            appendOption('from-currency', optionValue, optionName);
            appendOption('to-currency', optionValue, optionName);

            dataFound = true;
        }

        if(dataFound == false){
            webCurrencyData(dbPromise);
        }
    });

}


function webCurrencyData(dbPromise){
    const currenciesAPIURL = 'https://free.currencyconverterapi.com/api/v5/currencies';
    fetch(currenciesAPIURL).then(response => response.json()).then(data => {
        const currencies = data.results;

        for(let currencyIndex in currencies){
            let currencyData = currencies[currencyIndex];
            addCurrency(dbPromise,currencyData);
            const optionName = `${currencyData.currencyName} - (${currencyData.id})`;
            const optionValue = currencyData.id;
            appendOption('from-currency', optionValue, optionName);
            appendOption('to-currency', optionValue, optionName);
        }

        console.log(data);
    })
}



