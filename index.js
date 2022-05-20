// Create express app
var express = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
var app = express()
var db = require("./database.js")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Server port
var HTTP_PORT = 5000 
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Root endpoint
app.get("/", (req, res, next) => {
    res.render('index');
});

app.get("/create-new", (req, res, next) => {
    res.render('create');
});

app.get("/about-us", (req, res, next) => {
    res.render('about-us');
});

app.get("/locations", (req, res, next) => {
    res.render('location');
});

app.get("/contact-us", (req, res, next) => {
    res.render('contact-us');
});

app.get("/reports/", (req, res) => {
    var sql = "select * from pet";
    var params = [];
    db.all(sql, params, (err, json) => {
        if (err) {   
          res.status(400).json({"error":err.message});
          return;
        }
        console.log(json);
        var html='';
        if(json.length > 0){
            html = '<table><tr><th>Pet Name</th><th>Animal</th><th>Location</th><th>Action</th></tr>';
            for (var i = 0; i< json.length; i++) {
                html += '<tr><td>' + json[i].name + '</td><td>' + json[i].animal +'</td><td>'+ json[i].location +'</td><td><a href="report/'+ json[i].id + '">View</a>&nbsp; &nbsp;<a href="#"  onClick="delete_fn('+json[i].id+');" id="'+ json[i].id + '">Remove</a> </td></tr>';
            } 
            html += '</table>';
            //document.getElementById('target').innerHTML = html;
          }
          else{
              html = "<p>No Reports to be shown!</p>";
          }
        res.render('reports',{
            html: html
        });
      });


});



app.get("/report/:id", (req, res) => {

    var sql = "select * from pet where id = ?"
    var params = [req.params.id]
    db.get(sql, params, (err, results) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.render('report',{
            data: results
        });
      });
});


// Insert here other API endpoints
app.get("/api/reports", (req, res, next) => {
    var sql = "select * from pet"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            message:"success",
            data: rows
        })
      });
});

app.get("/api/report/:id", (req, res, next) => {

    var sql = "select * from pet where id = ?"
    var params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":row
        })
      });
});

app.post("/api/report/", (req, res, next) => {
    var errors=[]
    if (!req.body.name){
        errors.push("No Name specified");
    }
    if (!req.body.animal){
        errors.push("No Animal Category specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        name: req.body.name,
        animal: req.body.animal,
        location: req.body.location,
        desc: req.body.description
    }
    var sql ='INSERT INTO pet (name, animal, description, location) VALUES (?,?,?,?)'
    var params =[data.name, data.animal, data.desc, data.location]
    db.run(sql, params, function (err, result) {
        if (err){
            console.log(err)
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

app.put("/api/report/:id", (req, res, next) => {
    var data = {
        name: req.body.name,
        animal: req.body.animal,
        location: req.body.location,
        description: req.body.description
    }
    db.run(
        `UPDATE pet set 
           name = COALESCE(?,name), 
           animal = COALESCE(?,animal), 
           location = COALESCE(?,location),
           description = COALESCE(?,description)
           WHERE id = ?`,
        [data.name, data.animal, data.location, data.description, req.params.id],
        function (err, result) {
            if (err){
                console.log(err)
                res.status(400).json({"error": err})
                return;
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
    });
})

app.delete("/api/report/:id", (req, res, next) => {
    db.run(
        'DELETE FROM pet WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
})


// Default response for any other request
app.use(function(req, res){
    res.status(404);
});

