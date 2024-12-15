let modelEpoch,logPrice,logMAs
let apiKey = localStorage.getItem('apiKey')
let accNo = localStorage.getItem('accNo')

class Config{
    constructor(){
        this.modelFolder = 'model/';
        this.dataFolder = 'data/';
        this.baseUrl = `https://api-fxtrade.oanda.com/v3/accounts/${accNo}/instruments/NATGAS_USD/candles?granularity=M30&count=4000`;
        this.urlHeaders = {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"};
        this.MAs = [5*46,20*46,80*46,160*46];
    };

    getDataPoint(epoch,logPrice,logMAs,targets = true){
        let features =[
            // @ index 0: current price - MA5
            logPrice[epoch] - logMAs[5*46][epoch],

            // @ index 1: current price - MA20
            logPrice[epoch] - logMAs[20*46][epoch],

            // @ index 2: MA5 - MA80
            logMAs[5*46][epoch] - logMAs[80*46][epoch],

            // @ index 3: MA20 - MA160
            logMAs[20*46][epoch] - logMAs[160*46][epoch],

            // @ index 4: current MA5 - past(5) MA5
            logMAs[5*46][epoch] -  logMAs[5*46][epoch+5*46],

            // @ index 5: current MA5 - past(20) MA5
            logMAs[5*46][epoch] - logMAs[5*46][epoch+20*46],

            // @ index 6: current MA20 - past(20) MA20
            logMAs[20*46][epoch] - logMAs[20*46][epoch+20*46],

            // @ index 7: current MA20 - past(80) MA20
            logMAs[20*46][epoch] - logMAs[20*46][epoch+80*46],
        ];
        if(!targets){
            return features;
        };
        targets = [
            // @ index 0: future(20) price - current price
            logPrice[epoch-20*46] - logPrice[epoch],
             
            // @ index 1: highest price from current to future(20) - current price
            Math.max(...logPrice.slice(epoch-20*46,epoch)),

            // @ index 2: time of highest price - current time
            logPrice.slice(epoch-20*46,epoch).indexOf(Math.max(...logPrice.slice(epoch-20*46,epoch))),

            // @ index 3: lowest price from current to future(20) - current price
            Math.min(...logPrice.slice(epoch-20*46,epoch)),

            // @ index 4: time of lowest price - current time
            logPrice.slice(epoch-20*46,epoch).indexOf(Math.min(...logPrice.slice(epoch-20*46,epoch)))
        ];
        return [features,targets]
    }

    getModel(k = 8){
        attributes.k = k
        return new Model(attributes)
        
    }
    
    rollingMean(arr,num){
        let result = []
        let sum
        for(let i=0;i<=arr.length-num;i++){
            sum = 0
            for (let j=0;j<num;j++){
                sum += arr[i+j]
            }
            result.push(sum/num)
        }
        return result

    }

    fetchData(){
        let priceData = []
        let firstDate;
        logPrice = [];
        logMAs = {};
        return fetch(config.baseUrl,{headers:config.urlHeaders})
        .then((response)=>{
            return response.json()
        })
        .then((jsonObj)=>{
            let dataChunk = jsonObj.candles
            firstDate = dataChunk[0].time
            dataChunk.reverse()
            modelEpoch = dataChunk[0].time
            for (let candle of dataChunk){
                priceData.push(Number(candle.mid.o))
            }
        })
        .then(()=>{
            return fetch(`${config.baseUrl}&to=${firstDate}`,{headers:config.urlHeaders})
        })
        .then((response)=>{
            return response.json()
        })
        .then((jsonObj)=>{
            for (let candle of jsonObj.candles.reverse()){
                priceData.push(Number(candle.mid.o))
            }
        })
        .then(()=>{
            //rest of input code
            for (let price of priceData){
                logPrice.push( Math.log(price))
            }
            for (let ma of config.MAs){
                logMAs[ma] = []
                for (let price of config.rollingMean(priceData,ma)){
                    logMAs[ma].push(Math.log(price))
                }
            }
        })
    }

}
let config = new Config()
class Model{
    constructor(attributes){
        this.allFeatures = attributes.features;
        this.allTargets = attributes.targets;
        let byTarget = [];
        for (let i in this.allTargets[0]){
            byTarget.push([])
        };
        for(let targets of this.allTargets){
            for (let i in targets){
                byTarget[i].push(targets[i])
            }
        };
        this.byTarget = byTarget;
        this.weights = attributes.weights;
        this.means = attributes.means;
        this.stds = attributes.stds;
        this.k = attributes.k
    }
    getFactor(a,b){
        let dist = 0
        for (let i in a){
            dist += this.weights[i]*(a[i]-b[i])**2
        }
        return Math.sqrt(dist)
    }
    getNN(dp){
        let byFactor = []
        for (let i in this.allFeatures){
            byFactor.push([this.allTargets[i],1/this.getFactor(dp,this.allFeatures[i])])
        }
        byFactor.sort((tup1,tup2)=>{return tup2[1]-tup1[1]})
        return byFactor.slice(0,this.k)
    }
    outcome(dp){
        let sumFactor = 0
        let sumOutcomes = []
        for (let i in this.allTargets[0]){
            sumOutcomes.push(0)
        }
        for (let tup of this.getNN(dp)){
            sumFactor += tup[1]
            for (let i in tup[0]){
                sumOutcomes[i] += tup[1]*tup[0][i]
            }
        }
        for(let i in sumOutcomes){
            sumOutcomes[i] = sumOutcomes[i]/sumFactor
        }
        return sumOutcomes
    }
    input(epoch=0){
        let dpFeatures = config.getDataPoint(epoch,logPrice,logMAs,false)
        for (let i in dpFeatures){
            dpFeatures[i] = (dpFeatures[i] -this.means[i])/this.stds[i]
        }
        return dpFeatures
    }
}


let model = config.getModel()

function getAction(){
    let epochs = [3*46,6*46,9*46,12*46,15*46]
    let outcome,dataPoints,e
    return config.fetchData().then(()=>{
        for (let i in epochs){
            e = epochs[i]
            outcome = model.outcome(model.input(e))
            dataPoints = [
                {x:modelEpoch-epoch-e*1800,y:Math.E**logPrice[e]},
                {x:modelEpoch-epoch-(e-outcome[2])*1800,y:Math.E**(logPrice[e]+outcome[1])},
                {x:modelEpoch-epoch-(e-20*46)*1800,y:Math.E**(logPrice[e]+outcome[0])},
                {x:modelEpoch-epoch-(e-outcome[4])*1800,y:Math.E**(logPrice[e]+outcome[3])},
                {x:modelEpoch-epoch-e*1800,y:Math.E**logPrice[e]}
            ]
            shapes[i].dataPoints = dataPoints
        }
    })
}