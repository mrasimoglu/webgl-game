var loadTextResource = function(url)
{
    return new Promise((resolve, reject) => { 

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function() {
        if(request.status < 200 || request.status > 299)
            reject('Error: HTTP status ' + request.status + ' on source ' + url);
        else
            resolve(request.responseText);
    };
    request.send();
    } );
};
var loadTextResourceWait = async function(url)
{
    return await loadTextResource(url);
};


var loadImage = function (url) {
    return new Promise((resolve, reject) => { 
        var image = new Image();
        image.onload = function () {
            resolve(image);
        };
        image.src = url;
    });
};

var loadImageawait = async function (url) {
    return await loadImage(url);
};


var loadJSONResource = (url) => { 
    return new Promise((resolve, reject) => {
        loadTextResource(url).then((r)=> {
            resolve(JSON.parse(r));
        }).catch((err) => {
            reject(err);
        }); 
    });
};

 var getModels = async (textArray) => {
    
        var promises = [];
        textArray.forEach(function(element)
        {
            promises.push(loadJSONResource(element));
        });
        var val;
        
        await Promise.all(promises).then((res) => {
        val=res;
        });
   
        return val; 
};