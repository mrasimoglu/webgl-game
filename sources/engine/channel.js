class Channel {
    constructor(name, positionkeys, rotationkeys, scalingkeys)
    {
        this.name = name;
        this.positionkeys = [];
        this.rotationkeys = [];
        this.scalingkeys = [];
        

        positionkeys.forEach((pkey) => {
            this.positionkeys.push({"time": pkey[0], "arr": Object.assign([], pkey[1])});
        });
        rotationkeys.forEach((pkey) => {
            this.rotationkeys.push({"time": pkey[0], "arr": Object.assign([], pkey[1])});
        });
        scalingkeys.forEach((pkey) => {
            this.scalingkeys.push({"time": pkey[0], "arr": Object.assign([], pkey[1])});
        });

    } 

    getPKey(AnimationTime)
    {
        for(var i = this.positionkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.positionkeys[i].time)
                return i;
        }
    }
    getRKey(AnimationTime)
    {
        for(var i = this.rotationkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.rotationkeys[i].time)
                return i;
        }
    }
    getSKey(AnimationTime)
    {
        for(var i = this.scalingkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.scalingkeys[i].time)
                return i;
        }
    }

}

var ChannelArrayclass =
   function() {
        this.channels = [];
        this.channelsnames = new Object();
        this.push = (channel) => {this.channels.push(channel); this.channelsnames[channel.name] = this.channels[this.channels.length-1]};
        this.getChannelbyName = (name) => { return this.channelsnames[name]};
    };
 