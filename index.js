import bodyParser from "body-parser";
import express from "express";
import fs from "fs";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

async function getTitlesObject(){
    return new Promise((resolve, reject) => {
        fs.readFile("./titles.json", "utf8", function (err, data){
            if (err) throw err;
            else{
                console.log(data)
                let obj = JSON.parse(data);
                resolve(obj);
            }
        });
    });
}

//to render the home page
app.get("/", async (req, res) => {
    let obj = await getTitlesObject();
    let blogTitles = obj.titles;
    if(blogTitles.length == 0){
        res.render("home.ejs");
    }else{
        res.render("home.ejs", {blogTitles: blogTitles});
    }
});

//to display the blog
app.get("/blogs/:blogTitle", async (req, res) => {
    const {blogTitle} = req.params;
    let data = fs.readFileSync(`./blogs/${blogTitle}.txt`, "utf8");
    const blog = {
        title : blogTitle,
        content : data
    }
    console.log(blog);
    res.render("blog.ejs", blog);
});

//open the create blog window
app.get("/create-blog", (req, res) => {
    res.render("create.ejs");
});

//submit the blog, and display
app.post("/submit-blog", async (req, res) => {

    if(req.body["titleOfBlog"].length != 0 || req.body["contentOfBlog"].length != 0){
        let obj = await getTitlesObject();
        obj.titles.push(req.body["titleOfBlog"]);
        let updated_obj = JSON.stringify(obj);

        await fs.promises.writeFile("titles.json", updated_obj, "utf8", (err) => {
            if(err) throw err;
        });
        
        await fs.promises.writeFile(`blogs/${req.body["titleOfBlog"]}.txt`, req.body["contentOfBlog"], "utf8", function(err) {
            if(err) throw err;
            else{
                console.log("File created");
            }
        });
    }
    res.redirect("/");
});

//update blog window
app.get("/blogs/update/:title", async (req, res) => {
    const {title} = req.params;
    let data = fs.readFileSync(`./blogs/${title}.txt`, "utf8");
    const blog = {
        title : title,
        content : data
    }
    console.log(blog);
    res.render("update.ejs", blog);
});

//submit the updated block
app.post("/blogs/update-blog/:title", async (req, res) => {
    const {title} = req.params;
    const updated_content = req.body["updatedBlog"];

    await fs.promises.writeFile(`blogs/${title}.txt`, updated_content, "utf8", function(err) {
        if(err) throw err;
        else{
            console.log("File update");
        }
    });
    res.redirect(`/blogs/${title}`);
});

//delete the blog
app.post("/blogs/delete/:title", async (req, res) => {
    const {title} = req.params;
    fs.unlinkSync(`blogs/${title}.txt`);
    let obj = await getTitlesObject();
    let index = obj.titles.indexOf(title);
    obj.titles.splice(index, 1);
    console.log(obj.titles);

    let updated_obj = JSON.stringify(obj);

    await fs.promises.writeFile("titles.json", updated_obj, "utf8", (err) => {
        if(err) throw err;
    });

    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Listening at ${port}`);
});