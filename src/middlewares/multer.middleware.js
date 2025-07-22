// import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./public/temp")
//     },
//     filename: function (req, file, cb) {
      
//       cb(null, file.originalname)
//     }
//   })
  
// export const upload = multer({ 
//     storage, 
// })
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // where to save
  },
  filename: function (req, file, cb) {
    // Get the file extension (like .jpg, .pdf)
    const ext = path.extname(file.originalname);

    // Create a new unique filename with the original extension
    const uniqueName = `${uuidv4()}${ext}`;

    cb(null, uniqueName); // save with the UUID name
  },
});

export const upload = multer({ storage });

