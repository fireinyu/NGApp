
let stream,bidPrice,askPrice,midPrice,liveChart,hist,epoch
let count = 0
const priceData = []
const shapes = [
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'},
    {type:'line',markerType:'none'}
    ]

Promise.all([
    fetch(`https://stream-fxtrade.oanda.com/v3/accounts/${accNo}/pricing/stream?instruments=NATGAS_USD`,{headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"}})
    .then((response)=>{
        stream = response.body.pipeThrough(new TextDecoderStream()).getReader()
    }),
    fetch(`https://api-fxtrade.oanda.com/v3/accounts/${accNo}/instruments/NATGAS_USD/candles?count=1500&granularity=M2`,{headers : {'Authorization':`Bearer ${apiKey}`,'Accept-Datetime-Format':"UNIX"}})
    .then((response) => {
        return response.json()
    })
    .then ((jsonObj)=>{
        hist = jsonObj.candles
    })
])
.then(()=>{
    let len = hist.length
    
    for (let i = 0;i<len-1;i++){
        let thisDate = new Date(Number(hist[i].time*1000));
        let hh = String(thisDate.getHours()).padStart(2,'0');
        let mm = String(thisDate.getMinutes()).padStart(2,'0');
        let ss = String(thisDate.getSeconds()).padStart(2,'0');
        priceData.push({x:120*(i+1-len),y:Number(hist[i].mid.o),label:`${hh}:${mm}:${ss}`})
    }
    epoch = hist[len-1].time
    let thisDate = new Date(Number(hist[len-1].time*1000));
    let hh = String(thisDate.getHours()).padStart(2,'0');
    let mm = String(thisDate.getMinutes()).padStart(2,'0');
    let ss = String(thisDate.getSeconds()).padStart(2,'0');
    priceData.push({x:0,y:Number(hist[len-1].mid.o),label:`${hh}:${mm}:${ss}`})
    liveChart.options.axisX.stripLines =[{
        value:0,
        label:`epoch = ${hh}:${mm}:${ss}`,
        labelFontColor:'grey',
        color:'grey'
    }]

    streamRecursor()
})
    



function streamRecursor(){
    stream.read().
    then((chunk)=>{
        let parsed = JSON.parse(chunk.value)
        if (parsed.type == 'PRICE'){
            bidPrice = Number(parsed.closeoutBid)
            askPrice = Number(parsed.closeoutAsk)
            midPrice = (bidPrice+askPrice)/2
        }
        try {
            let thisDate = new Date(parsed.time*1000)
            document.querySelector('#midPrice').innerHTML = `Price: ${midPrice.toFixed(5)}` 
            document.querySelector('#priceTime').innerHTML=`(updated at ${thisDate.toLocaleString('en-GB')})`
            priceData[priceData.length-1].markerSize = 1;
            priceData[priceData.length-1].markerColor = 'orange';
            priceData.push({x:Number(parsed.time)-epoch,y:midPrice,markerSize:6,markerColor:'red'})
            liveChart.options.axisX.viewportMinimum = parsed.time - epoch - 82800
            liveChart.options.axisX.viewportMaximum = parsed.time -epoch + 3600
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

liveChart = new CanvasJS.Chart('liveChartContainer',{
    zoomEnabled:true,
    margin:10,
    title:{
        text:'Live Natural Gas Price'
    },
    axisX:{
        gridThickness:0.3,
        gridDashType:'dash',
        valueFormatString:'###s',

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
            toolTipContent:'{x}s from epoch, price:{y}',     
            type: 'line',
            name: 'mid price',
            showInLegend:true,
            markerType:'circle',
            markerColor:'orange',
            markerSize:1,
            color:'orange',
            dataPoints:priceData
        },
        shapes[0],
        shapes[1],
        shapes[2],
        shapes[3],
        shapes[4],
        shapes[5]

        
    ]
});
document.querySelector('#accounts').onclick = (e) =>{
    localStorage.removeItem('accNo');
    location.replace('accounts.html');
}
document.querySelector('#predict').onclick = ()=>{
    document.querySelector('#predict').innerHTML = "loading..."
    document.querySelector('#predict').disabled = true
    getAction().then(()=>{
        document.querySelector('#predict').innerHTML = "predict"
        document.querySelector('#predict').disabled = false
        let thisDate = new Date(modelEpoch*1000)
        document.querySelector('#modelEpoch').innerHTML = `Prediction is relative to data at ${thisDate.toLocaleString('en-GB')}`
        liveChart.render()
    })
}
document.querySelector("#predict").disabled = false
//DOMContentLoaded block end
})