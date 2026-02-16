import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema= new mongoose.Schema({
    username:{
        type:String,
        required:[true,'Please Provide a Username'],
        unique:true,
        trim:true,
        minLength:[3,'Username must be atleast 3 characters long']
    },
    email:{
        type:String,
        required:[true,'Please Provide an Email'],
        unique:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/,'Please provide a valid email']
    },
    password:{
        type:String,
        required:[true,'Please Provide a password'],
        minLength:[6,'Password must be atleast 6 characters long'],
        select:false
    },
    profileImage:{
        type:String,
        default:null
    }
}, {
    timestamps:true
});

// Hash password before saving
userSchema.pre('save',async function(next) {
    if(!this.isModified('password')){
        next();
    }
    
    const salt=await bcrypt.genSalt(10);
    this.password=await bcrypt.hash(this.password,salt);
});

// Compare passowrd method
userSchema.methods.matchPassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
};

const User= mongoose.model('User',userSchema);

export default User;
