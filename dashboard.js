
apiKey = localStorage.getItem('apiKey')
accNo = localStorage.getItem('accNo')
let stream,bidPrice,askPrice,midPrice,liveChart,hist
let count = 0
const priceData = []
let pendingCalls = 0

pendingCalls += 1
fetch(`https://stream-fxtrade.oanda.com/v3/accounts/${accNo}/pricing/stream?instruments=NATGAS_USD`,{headers : {'Authorization':`Bearer ${apiKey}`}})
.then((response)=>{
    stream = response.body.pipeThrough(new TextDecoderStream()).getReader()
})
.then(()=>{
    pendingCalls -= 1;
    if (pendingCalls === 0){
        for (candle of hist){
            priceData.push({x:new Date(candle.time),y:Number(candle.mid.o),markerType:'none'})
        }
        streamRecursor()
    }
})
pendingCalls +=1
fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/instruments/NATGAS_USD/candles`,{headers : {'Authorization':`Bearer ${apiKey}`}})
.then((response) => {
    response.json()
    .then((jsonObj)=>{
    hist = jsonObj.candles
    pendingCalls -= 1;
    if (pendingCalls === 0){
        for (candle of hist){
            priceData.push({x:new Date(candle.time),y:Number(candle.mid.o),markerType:'none'})
        }
        streamRecursor()
    }
    })
})

    



function streamRecursor(){
    stream.read().
    then((chunk)=>{
        let parsed = JSON.parse(chunk.value)
        time = new Date(parsed.time)
        if (parsed.type == 'PRICE'){
            bidPrice = Number(parsed.closeoutBid)
            askPrice = Number(parsed.closeoutAsk)
            midPrice = (bidPrice+askPrice)/2
        }
        try {
            document.querySelector('#midPrice').innerHTML = midPrice.toFixed(5)
            priceData.slice(-1)[0].markerType = 'none'
            priceData.push({x:time,y:midPrice})
            liveChart.render()
        } catch (error) {
        }
        
        
        
        
    }).then(()=>{
        setTimeout(streamRecursor,300)
    })
    
}

document.addEventListener("DOMContentLoaded",(e)=>{
//DOMContentLoaded block start

document.querySelector('#logout').onclick = (e) =>{
    localStorage.clear();
    location.replace('login.html');
}

document.querySelector('#accounts').onclick = (e) =>{
    localStorage.removeItem('accNo');
    location.replace('accounts.html');
}

liveChart = new CanvasJS.Chart('liveChartContainer',{
    zoomEnabled:true,
    margin:10,
    title:{
        text:'Live Natural Gas Price'
    },
    axisX:{
        gridThickness:0.3,
        gridDashType:'dash',
        valueFormatString:'hh:mm:ss',
        crosshair:{
            enabled:true,
            thickness:0.5,
        }
    },
    axisY:{
        gridThickness:0,
        interlacedColor: "#F0F8FF",
        crosshair:{
            enabled:true,
            thickness:0.5
        }
    },
    data:[
        {
            toolTipContent:'{y}',     
            type: 'line',
            name: 'mid price',
            showInLegend:true,
            markerType:'circle',
            markerColor:'red',
            markerSize:5,
            color:'orange',
            dataPoints:priceData
        },
        {
            toolTipContent:null

        }
    ]
});

//DOMContentLoaded block end
})