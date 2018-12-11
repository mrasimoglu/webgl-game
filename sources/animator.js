class Animator {
    constructor (animations, model)
    {
        this.currentAnimation = -1;
        
        this.animationStartTime = 0;
        this.animations = animations;
        this.Model = model;
    }

    playAnimation(id)
    {
        if(this.animations[id] == undefined)
            return false;
        this.currentAnimation = this.animations[id];
        this.animationStartTime = Date.now();
        
        return true;
    }

    getAnimationTime()
    {
        return ((Date.now() - this.animationStartTime) / (1000 / this.currentAnimation.tickspersecond)) % this.currentAnimation.duration;
    }

    loopinside(root, ParentTransform, m_GlobalInverseTransform, ATime)
    {
        var NodeTransformation = glMatrix.mat4.create();
       
        var currentAnimChannel = this.currentAnimation.channels.getChannelbyName(root.name);
        
        if(currentAnimChannel != undefined)
        {
            var RotationMatrix = glMatrix.mat4.create();
            var rquat = this.CalcInterpolatedRotation(currentAnimChannel.getRKey(ATime),currentAnimChannel.rotationkeys, ATime);
            glMatrix.mat4.fromQuat(RotationMatrix, rquat);
            
            var TransformationMatrix = glMatrix.mat4.create();
            var tv3 = this.CalcInterpolatedLocation(currentAnimChannel.getPKey(ATime),currentAnimChannel.positionkeys, ATime);
            glMatrix.mat4.fromTranslation(TransformationMatrix, tv3);

            var ScalingMatrix = glMatrix.mat4.create();
            var sv3 = this.CalcInterpolatedScaling(currentAnimChannel.getSKey(ATime),currentAnimChannel.scalingkeys, ATime);
            glMatrix.mat4.fromScaling(ScalingMatrix, sv3);
            
            glMatrix.mat4.mul(NodeTransformation, TransformationMatrix, RotationMatrix);
            glMatrix.mat4.mul(NodeTransformation, NodeTransformation, ScalingMatrix);
        }

        var GlobalTransformation = glMatrix.mat4.create();
        glMatrix.mat4.mul(GlobalTransformation, ParentTransform, NodeTransformation);
       
        var bones= this.Model.getBoneByName(root.name);
    
        bones.forEach((bone)=>{
            bone.calcFinaltransformation(m_GlobalInverseTransform, glMatrix.mat4.clone(GlobalTransformation));
        });
        root.mesh.forEach(m => {
            this.Model.meshes[m].transformation = glMatrix.mat4.clone(GlobalTransformation);
        });
   

        root.childs.forEach((child) => {
            this.loopinside(child, glMatrix.mat4.clone(GlobalTransformation),m_GlobalInverseTransform, ATime);
        });  
    }

    CalcInterpolatedRotation(index,RotationKeys, AnimationTime )
    {
        var q1 = glMatrix.quat.fromValues(RotationKeys[index].arr[1], RotationKeys[index].arr[2], RotationKeys[index].arr[3] ,RotationKeys[index].arr[0]);
    
        if(RotationKeys.length == 1)
        {
            return q1;
        }

        var nextIndex = index + 1;
        var DeltaTime = RotationKeys[nextIndex].time - RotationKeys[index].time;
        var Factor = (AnimationTime - RotationKeys[index].time) / DeltaTime;
   
        var q2= glMatrix.quat.fromValues(RotationKeys[nextIndex].arr[1], RotationKeys[nextIndex].arr[2], RotationKeys[nextIndex].arr[3] ,RotationKeys[nextIndex].arr[0]);
        var q3 = glMatrix.quat.create();
        glMatrix.quat.slerp(q3, q1,q2, Factor);
        glMatrix.quat.normalize(q3, q3);

        return q3;
    }
    CalcInterpolatedLocation(index,TransformationKes, AnimationTime )
    {
        var v3= glMatrix.vec3.fromValues(TransformationKes[index].arr[0], TransformationKes[index].arr[1], TransformationKes[index].arr[2]);
        if(TransformationKes.length == 1)
        {
            return v3;
        }

        var nextIndex = index+1;
        var DeltaTime = TransformationKes[nextIndex].time - TransformationKes[index].time;
        var Factor = (AnimationTime - TransformationKes[index].time) / DeltaTime;

        var v2= glMatrix.vec3.fromValues(TransformationKes[nextIndex].arr[0], TransformationKes[nextIndex].arr[1], TransformationKes[nextIndex].arr[2]);
        var Delta = glMatrix.vec3.create();
        var Out = glMatrix.vec3.create();
        glMatrix.vec3.subtract(Delta, v2, v3);
        glMatrix.vec3.scaleAndAdd(Out, v3, Delta, Factor);
        
        return Out;
    }
    CalcInterpolatedScaling(index, ScalingKeys, AnimationTime)
    {
        var v3= glMatrix.vec3.fromValues(ScalingKeys[index].arr[0], ScalingKeys[index].arr[1], ScalingKeys[index].arr[2]);
        if(ScalingKeys.length == 1)
        {
            return v3;
        }

        var nextIndex = index+1;
        var DeltaTime = ScalingKeys[nextIndex].time - ScalingKeys[index].time;
        var Factor = (AnimationTime - ScalingKeys[index].time) / DeltaTime;

        var v32= glMatrix.vec3.fromValues(ScalingKeys[nextIndex].arr[0], ScalingKeys[nextIndex].arr[1], ScalingKeys[nextIndex].arr[2]);
        var Delta = glMatrix.vec3.create();
        var Out = glMatrix.vec3.create();
        glMatrix.vec3.subtract(Delta, v32, v3);
        glMatrix.vec3.scaleAndAdd(Out, v3, Delta, Factor);
        return Out;
    }
}

class AnimationGL {
    constructor(AnimationFromJson)
    {
        this.name = AnimationFromJson.name;
        this.duration = AnimationFromJson.duration;
        this.tickspersecond = AnimationFromJson.tickspersecond;
        this.channels = new ChannelArrayclass();
        
        AnimationFromJson.channels.forEach((channel) => {
            this.channels.push(new Channel(channel.name, channel.positionkeys, channel.rotationkeys, channel.scalingkeys));
        });
    }

    getAnimationTime()
    {
        return;
    }
}

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
 