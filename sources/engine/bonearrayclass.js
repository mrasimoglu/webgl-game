class BoneArrayClass
{
    constructor()
    {
        this.bones = [];
        this.bonesnames = new Object();
    }

    push(bone)
    {
        this.bones.push(bone); 
        this.bonesnames[bone.name] = this.bones[this.bones.length-1];
    }
    getBoneByID(id)
    {
        return this.bones[id];
    } 
    getBoneByName(name)
    {
        return this.bonesnames[name];
    }
    getBonesFinalFlat()
    {
        return this.bones.reduce((x,y) => x.concat(y.finaltransformation.reduce((a,b) => a.concat(b),[])), []);
    }
    getLength()
    {
        return this.bones.length;
    }
    copy()
    {
        var newone = Object.create(BoneArrayClass.prototype);
        newone.bones = Array.from(this.bones);;
        newone.bonesnames = this.bonesnames;
        return newone;
    }
}