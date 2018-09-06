var mysql = require("mysql");
var inquirer = require("inquirer");
var selectedID;
var selectedQuantity;
var currentQuantity;
var currentPrice;

var connection = mysql.createConnection
(
    {
        host: "localhost",
        port: 8889,
        user: "root",
        password: "root",
        database: "bamazon"
    }
);

connection.connect(function(err)
{
    if(err)
    {
        throw err;
    }

    //console.log("Connected as id " + connection.threadId);
    readBamazon();
});

function readBamazon()
{
    connection.query
    (
        "SELECT * FROM products", function(err, response)
        {
            if(err)
            {
                throw err;
            }

            response.forEach(function(element)
            {
                console.log("ID: " + element.item_id);
                console.log("Product: " + element.product_name);
                console.log("Department: " + element.department_name);
                console.log("Price: " + element.price);
                console.log("# Available: " + element.stock_quantity);
                console.log("-------------------------------------------------");
            });
            //console.log(response);
            placeOrder();
        }
    )
}

function placeOrder()
{
    connection.query("SELECT * FROM products", function(err, response)
    {
        inquirer.prompt
        (
            [
                {
                    type: "input",
                    name: "id",
                    message: "What is the ID of the product you'd like to order?",
                    validate: function(value)
                    {
                        for(var i = 0; i < response.length; i++)
                        {
                                if(response[i].item_id == value)
                                {
                                    return true;
                                }
                        }
                    }
                },
                {
                    type: "input",
                    name: "qty",
                    message: "How many would you like to order?",
                    validate: function(value)
                    {
                        if(isNaN(value) == false)
                        {
                            return true;
                        }
                        return false;
                    }
                }
            ]
        ).then(function(answer)
        {
            connection.query("SELECT * FROM products WHERE item_id = ?",[answer.id],function(err, results)
                {
                    selectedID = answer.id;
                    selectedQuantity = answer.qty;
                    currentQuantity = results[0].stock_quantity;
                    currentPrice = results[0].price;
                    console.log(results);

                    if(err)
                    {
                        throw err;
                    } 
                    else if(selectedQuantity <= currentQuantity)
                    {
                        console.log("Order Placed!");
                        updateProducts();
                    }
                    else
                    {
                        console.log("Insufficient Quantity!");
                        connection.end();
                    }
                }
            );
        });
    });
}

function updateProducts()
{
    connection.query("UPDATE products SET ? WHERE ?",
    [
        {
            stock_quantity: currentQuantity - selectedQuantity
        },
        {
            item_id: selectedID
        }
    ],function(err, response)
    {
        var orderPrice = currentPrice * selectedQuantity;
        console.log("Order Price: $" + orderPrice);
        inquirer.prompt
        (
            [
                {
                    type: "confirm",
                    name: "newOrder",
                    message: "Would you like to place another order?",
                    default: true
                }
            ]
        ).then(function(response)
        {
            if(response.newOrder == true)
            {
                readBamazon();
            }
            else
            {
                connection.end();    
            }
        });
    });
}