declare namespace Express {
  import mongoose from 'mongoose';

  export interface User {
    _id: mongoose.Types.ObjectId;
  }
}
