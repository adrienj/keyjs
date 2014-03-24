# KeyJS

Micro JavaScript MVC Framework for single-page web apps (6KB).
 
## Features

- Templating (external templates supported)
- Multi-tabs management
- Persistant data storage (localStorage)
- HTML5 History API (pushstate)
- Dynamic links (href="/controller/param1/param2")
- Browser support from IE10 to mobile

## Documentation

### Getting Started

    var app = {
        models: {
            modelName: {
                propertyName: 'defaultValue',

                customMethodName: /* function... {} */
            }
        },

        views: {
            jQuery: true,
            templating: 'tjs'
        },

        controllers: {
            index: {
                data: function() { return /*data for template*/; },
                onload: function() {/* you main script * /}

                // Your custom controller methods here
            },
            about: {/*...*/},
            contact: {/*...*/}
        }
    };

To make your markup come alive and load the default controller :

    new Key(app);
    
For dependancy management, consider using requirejs or yepnopejs. Note: localStorage, jQuery and tjs are the only supported libraries/APIs for now.
    
Default data configuration

    app.localStorage = true; // Use the browser's data storage
    app.autoLoad = true; // Loads data from localStorage
    app.autoSave = true; // You can change this at any time
    app.autoStart = true; // If set to false, launch you app manualy with Key(app).start()

### Models

Data models are optional. Example of a model :

    app.models = {
        notes: {
            content: '',  // Default values can be strings, numbers, arrays and objects of these
            
            // Avoid set, get, insert and delete in properties and method names
            prefixContent: function(content) {
                return 'lorem' + content;
            }
        }
    };

Usage in a controller :

    this.models.notes.insert({
        content: this.models.notes.prefixContent('ipsum');
    }); // returns {id: 0, content: 'lorem ipsum'}
    
    this.models.notes.get();  // [ {id: 0, content: 'lorem ipsum'} ]
    this.models.notes.get(0); // {id: 0, content: 'lorem ipsum'}
    
    this.models.notes.set(0, {content: 'modified'});
    // or
    this.models.notes.set({id: 0, content: 'modified'});

    this.models.notes.delete(0);
    
To search specifics elements, Array.reduce is always handy. If app.autoSave is set to true, all these actions are saved in memory or localStorage. Outside a controller, replace 'this' with 'app'.

### Views

Templates are optional. Your application is either in a custom container (default is class="key-app") or in the document body if the specified container is not found.
Templates can be rendered in a different container (default is class="key-main").

    <body>
        <header> 
            <a href="/about">About this app</a> <!-- clicks will load 'about' controller automagicaly -->
        </header>

        <div class="key-main">
            <!-- templates rendered here -->
        </div>
    </body>
    
Controllers and templates (views) must have the same name.

    <script class="key-index" type="text/html">
        Hello {{=name}}
        <input class="key-sayhello" type="button" value="Say hello"/>
    </script>

    app.views.templating = 'tjs'; // Only https://github.com/jasonmoo/t.js (400 bytes) supported for now

KeyJs will fetch tpl/viewName.html if the themplate is not included in index.html like above, and diplay it if the file exists. DOM elements with prefixed classes ('key-' by default) are cached in this.view in the controller. No need to use selectors.

    app.controllers.index = {
        onload: function() {
            // Without app.views.jquery === true
            this.view.sayhello.onclick = function(){/* ... */};
            // With it
            this.view.sayHello.click(function(){/* ... */});
        }
    };

To access a cached dom element outside of the dedicated container you're in, make it available  in app.view through :

    app.views = {
        global: {
            menuBtn: 'menuBtn'
        }
    };
    
Default values :

    app.views.path = 'tpl/'; // Templates are downloaded from this directory
    app.views.prefix = 'key-'; // Classes prefix for containers and dom elements

    app.views.containers = {
        app: 'app', // app container class name,
        main: 'main', // templates container class name,

        // Your custom templates container (like menu or userbox, depending on your needs)
    }

### Controllers
    
Controllers are optional. The default controller is app.controllers.default = 'index'.
Load a controller :

    // In a controller
    this.load('controllerName', [/*arguments*/], 'containerName') // The default container is the templates container.
    // Anywhere else, use app.load

All arguments are optional and app.controllers.current is updated with the name of the last loaded controller. 

The global onload method is executed before the first controller is loaded

    app.controllers.onload = function() {
        this.view.menuBtn.click(function() {/*...*/});
    };

Example of controller

    app.controllers.index = {
        // Used in the template
        data: function() {
            return { name: 'John' };
        },

        // Event binding, animations, ajax...
        onload: function() {
            /* Given 
                this.view : prefixed elements from the DOM
                this.models : app.models with extended objects
                this.load(controllerName, params, container) : redirect to a specific controller, anytime
                this.youCustomMethodHere...
            */
        },

        // Your custom controller methods
    };

Example of context nesting
    
    // In a controller
    this.view.helloname.onclick = function() { 
        alert('Hello '+ app.view.name.value);
    };    
    
### Using dynamic URL

To prevent a 404 after reloading, put this .htaccess next to your index.html

    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} -s [OR]
    RewriteCond %{REQUEST_FILENAME} -l
    RewriteRule ^.*$ - [NC,L]
    RewriteRule ^.*$ /index.html [NC,L]

More code to eat on https://github.com/adrienj/thatmuch (mobile web app built on KeyJs).
Reminder: be careful, KeyJS is still under developement, use at your own risks. 
