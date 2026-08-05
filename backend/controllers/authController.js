const User=require("../models/User");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");


exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.login=async(req,res)=>{

try{

const {email,password}=req.body;

const user=await User.findOne({email});

if(!user){

return res.status(404).json({
message:"User not found"
});

}

const match=await bcrypt.compare(password,user.password);

if(!match){

return res.status(400).json({
message:"Invalid Password"
});

}

const token=jwt.sign(

{id:user._id},

process.env.JWT_SECRET,

{expiresIn:"7d"}

);

res.json({

success:true,

token,

user

});

}

catch(err){

res.status(500).json({
message:err.message
});

}

};