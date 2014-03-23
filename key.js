;(function($, tjs) {
    "use strict";

    window.Key = function(cfg) {
        cfg = cfg || {};

        cfg.models = cfg.models || {};
        cfg.views = cfg.views || {containers:{}, global:{}};
        cfg.controllers = cfg.controllers || {};
        
        var key = this,

            // Utilities
            helpers = {
                call: function(func, context, args) {
                    return func.apply(context, args && [].slice.call(args)); 
                },
                isObject: function(obj) {
                    return obj instanceof Object && ({}).toString.call(obj) !== '[object Function]';
                },
                isArray: function(arr) {
                    return arr && Object.prototype.toString.call(arr) === '[object Array]';
                },
                map: function(arr, callback) {
                    return [].slice.call(arr).map(callback);
                },
                extend: function(destination, source, noFunction) {   
                    for (var property in source) {
                        if(!noFunction || typeof source[property] !== 'function') {
                            destination[property] = source[property];
                        }
                    }
                    return destination;
                },
                addEvent: (function () {
                  if (document.addEventListener) {
                    return function (el, type, fn) {
                      if (el && el.nodeName || el === window) {
                        el.addEventListener(type, fn, false);
                      } else if (el && el.length) {
                        for (var i = 0; i < el.length; i++) {
                          addEvent(el[i], type, fn);
                        }
                      }
                    };
                  } else {
                    return function (el, type, fn) {
                      if (el && el.nodeName || el === window) {
                        el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
                      } else if (el && el.length) {
                        for (var i = 0; i < el.length; i++) {
                          addEvent(el[i], type, fn);
                        }
                      }
                    };
                  }
                })(),
                localStorage: function () {
                    try{return 'localStorage' in window && window.localStorage!==null;}catch(e){console.log('LocalStorage not found');return false;}
                },
                isTouchDevice: function () {
                  return 'ontouchstart' in window || 'onmsgesturechange' in window;
                },
                // https://gist.github.com/azproduction/1625623 without the 'with' statement
                ajax: function(m,u,c,d,x){x=new(window.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP");x.onreadystatechange=function(){x.readyState^4||c(this)},x.open(m,u),x.send(d)}
            },


            // HTML5 History
            nav = {
                popState: function(event) {
                    if(event.state) {
                        nav.load(key.parseUrl(event.state.url), event.state.url, true);
                    }
                },
                // PushState
                load: function(data, url, fromPopState) {
                    if(fromPopState) {
                        data = key.parseUrl(url);
                    } else {
                        data.url = url;
                        history.pushState(data, data.controller, cfg.base + url);
                    }
                    key.load(data.controller, data.arguments);
                }                
            },


            gui = {
                path: cfg.views.path || 'tpl/',
                prefix: cfg.views.prefix || 'key-',

                containers: {
                    app: cfg.views.app || 'app',
                    main: cfg.views.main || 'main',
                    fallback: document.body,
                },

                cache: {
                    parse: {}, // Dom Elements
                    view: {}, // Templates
                },

                getElement: function(name, element) {
                    return document.body.querySelector((element || '') + '.' + this.prefix + name);
                },
                
                print: function(template, data, container) {
                    if(tjs) {
                        container.innerHTML = new tjs(template).render(data);
                    } else {
                        container.innerHTML = template;
                    }
                },

                cacheContainers: function() {
                    helpers.extend(this.containers, cfg.views.containers);
                    for(var container in this.containers) {
                        if(this.containers.hasOwnProperty(container) && typeof this.containers[container] === 'string') {
                            cfg.views.containers[container] = this.getElement(this.containers[container]) || this.containers.fallback;
                        }
                    }
                },

                // Print the template in a container
                render: function(view, data, container, callback) {
                    var local = this.getElement(view, 'script');

                    if(local) {
                        this.print(local.innerHTML, data, container);
                        callback && callback();
                    } 
                    else if(this.cache.view[view]) {
                        this.print(this.cache.view[view], data, container);
                        callback && callback();
                    } else {
                        helpers.ajax('get', this.path + view + '.html', function(event) {
                            if(event.status !== 404) {
                                gui.print(event.responseText, data, container);
                                gui.cache.view[view] = event.responseText;
                            }
                            callback && callback();
                        });
                    }
                },

                // Returns DOM elements with prefixed classes
                parse: function(container, views) {
                    var classes, name, 
                        prefixReg = new RegExp('.*?' + this.prefix + '([\\w_\\-]+)[\\s\\W]*?');
                    
                    container = container || cfg.views.containers.app;
                    views = views || {};

                    [].slice.call(container.querySelectorAll('*[class*='+this.prefix+']')).forEach(function(element) {
                        if(classes = element.className.match(prefixReg)) {
                            name = classes[1];
                            
                            if(views[name]) {
                                if(!helpers.isArray(views[name])) {
                                    views[name] = [views[name]];
                                }
                                views[name].push(element);
                            } else {
                                views[name] = element;
                            }
                        }
                    });

                    if(cfg.views.jQuery && $) {
                        for(name in cfg.views.global) {
                            if(cfg.views.global.hasOwnProperty(name)) {
                                views[name] = $(document.body.querySelector('.' + this.prefix + cfg.views.global[name]));
                            }
                        }
                        for(name in cfg.views.containers) {
                            if(cfg.views.containers.hasOwnProperty(name)) {
                                views[name] = $(cfg.views.containers[name]);
                            }
                        }
                        for(name in views) {
                            if(views.hasOwnProperty(name)) {
                                views[name] = $(views[name]);
                            }
                        }
                    }

                    // local links
                    this.bindLinks(container);

                    return views;
                },

                // Allows dynamic <a> tags
                bindLinks: function(container) {
                    helpers.map(container.getElementsByTagName('a'), function(element) {
                        if(/^\//.test(element.getAttribute('href'))) {
                            helpers.addEvent(element, 'click', function(e) {
                                var href = this.getAttribute('href');
                                nav.load(key.parseUrl(href), href);
                                e.preventDefault();
                            });
                        }
                    });
                },

                clear: function(container) {
                    (cfg.views.containers[container] || cfg.views.global[container]).innerHTML = '';
                }
            },


            models = {
                data: {}, // Data
                schema: {}, // Models
                
                storageKey: cfg.storageKey || 'key.data',

                crud: {
                    set: function(id, object) { // Or function({id: 1, ... })
                        if(!object) {
                            object = id;
                            id = object.id;
                        }
                        helpers.extend(models.data[this.name][id], object);
                        cfg.autoSave && models.save();
                        return this;
                    },
                    get: function(id) {
                        return typeof id !== 'undefined' ? models.data[this.name][id] : models.data[this.name];
                    },
                    insert: function(entry) {
                        var property, obj = {};
 
                        for(property in models.schema[this.name]) {
                            if(models.schema[this.name].hasOwnProperty(property)) {
                                obj[property] = entry[property] || models.schema[this.name][property];
                            }
                        }

                        obj.id = models.data[this.name].length;
                        models.data[this.name][obj.id] = obj;

                        if(cfg.autoSave) {
                            models.save();
                        }

                        return obj;
                    },
                    delete: function(id) {
                        var property;

                        if(typeof id !== 'undefined') {
                            delete models.data[this.name][id];
                        } else {
                            models.data[this.name] = [];
                        }

                        if(cfg.autoSave) {
                            models.save();
                        }

                        return this;
                    }
                },

                // Add CRUD to cfg.models
                bind: function(model, name) {
                    var behaviours = {};

                    this.data[name] = this.data[name] || [];
                    this.schema[name] = helpers.extend({}, model, true);

                    model.name = name;
                    helpers.extend(model, this.crud);

                    return model;
                },

                save: function() {
                    if(helpers.localStorage) {
                        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
                    }
                },
                clear: function() {
                    if(helpers.localStorage) {
                        localStorage.setItem(this.storageKey, undefined);
                    }
                },
                restore: function() {
                    var data;
                    if(helpers.localStorage && (data = localStorage.getItem(this.storageKey)) !== null) {
                        this.data = JSON.parse(data);
                    }
                }
            },



            controllers = {
                default: 'index',

                // Extend controllers
                bind: function(name, options) {
                    var controller = helpers.extend({}, options);

                    controller.name = name;
                    controller.models = cfg.models;
                    controller.load = key.load;

                    cfg.controllers[name] = controller;

                    return controller;
                },

                // Global onload method
                firstLoad: function(controller) {
                    if(cfg.controllers.onload) {
                        // Context
                        helpers.extend(cfg.controllers, {
                            view: gui.cache.parse.app,
                            models: cfg.models,
                            load: key.load
                        });
                        cfg.controllers.onload(controller);
                    }
                },

                // After rendering
                load: function(controller, args, generator, target, container) {
                    var _load = function() { 
                        controller.view = gui.cache.parse[controller.name] = gui.parse(container);
                        if(!target) {
                            cfg.view = controller.view;
                        }
            
                        // Onchange event fired
                        if(cfg.controllers.onchange) {
                            controller.view = helpers.extend(controller.view, gui.cache.parse.app);
                            cfg.controllers.onchange.call(controller, controller);
                        }

                        return controller.onload && controller.onload.apply(controller, args); 
                    };

                    if(generator) {
                        return _load;
                    } else {
                        return _load();
                    }
                }
            };


        // Parses /details/543 or /news/id=420&page=32
        key.parseUrl = function(url) {
            var segments = url.split('/').splice(1),
                page = {
                    controller: segments.shift(),
                    arguments: []
                }, 
                object, keys, i;

            for(i in segments) {
                if(segments[i].indexOf('&') === -1) {
                    page.arguments[i] = unescape(segments[i]);
                } else {
                    page.arguments[i] = {};
                    object = segments[i].split('&');
                    for(keys in object) {
                        page.arguments[i][object[keys].split('=')[0]] = unescape(object[keys].split('=')[1]);
                    }   
                }
            }

            return page;
        };

        // Dispatcher
        key.load = function(name, args, target) {
            var controller, data, container;

            if(!name) {
                name = cfg.controllers.default || controllers.default;
            }

            // Arguments as array
            if(args && !helpers.isArray(args)) {
                args = [args];
            }

            if((controller = cfg.controllers[name]) && controller.data) {
                cfg.controllers.current = name;                
                data = controller.data.apply(controller, args);
            }

            container = cfg.views.containers[target] || cfg.views.containers.main || cfg.views.containers.app;
            controller = cfg.controllers[name];

            if(controller) {
                // Render and fire onload event
                gui.render(name, data, container, controllers.load(controller, args, true, target, container));
            } else {
                gui.render(name, data, container);
            
                // Onchange event fired
                if(cfg.controllers.onchange) {
                    cfg.controllers.view = gui.cache.parse.app;
                    cfg.controllers.onchange();
                }
            }

            return data;
        };

        // Config & Load index
        key.start = function() {
            var name, url, page = {};

            cfg.load = this.load;
            cfg.clear = gui.clear;
            cfg.helpers = cfg.helpers ? helpers.extend(cfg.helpers, helpers) : helpers;

            // Cache dom elements
            gui.cacheContainers();
            gui.cache.parse.app = gui.parse();

            // HTML5 History API init
            window.addEventListener('popstate', nav.popState);
       
            // Register models
            if(cfg.autoLoad) {
                models.restore();
            }
            for(name in cfg.models) {
                if(cfg.models.hasOwnProperty(name)) {
                    models.bind(cfg.models[name], name);
                }
            }

            // Register controllers
            for(name in cfg.controllers) {
                if(cfg.controllers.hasOwnProperty(name) && helpers.isObject(cfg.controllers[name])) {
                    controllers.bind(name, cfg.controllers[name]);
                }
            }

            // Load controller/view
            if(cfg.base && (url = window.location.pathname.split(cfg.base)[1]) !== '/') {
                // Url defined
                page = this.parseUrl(url);
                controllers.firstLoad(cfg.controllers[page.controller]);
                nav.load(page, url);
            } else {                
                // Default controller
                controllers.firstLoad(cfg.controllers[name]);
                this.load((cfg.controllers && cfg.controllers.default) || 'index');
            }

            return this;
        };

        // Launch app by default
        if(typeof cfg.autoStart === 'undefined' || cfg.autoStart) {
            this.start();
        }

        return this;
    };
})(window.jQuery, window.t);