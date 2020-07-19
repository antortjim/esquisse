var dragulaBinding = new Shiny.InputBinding();

find_match = function(key, mapping) {
  /*
  Return the HTML element that corresponds to what
  the user has mapped to the key variable
  
  Arguments
  key: string, dragula input
  mapping: object containing Strings
  
  Return The String that matches the passed key
  */
  var match;
  Object.keys(mapping).forEach(function(x) {
    if (key.includes(x)) {
      match = mapping[x];
    }
  });
  return match;
};

extract_vars = function(target) {
  /*
  Return a JS object with keys set to data levels
  (column names)
  and values to HTML elements representing them (badges)
  */
  target = target.replace(/(\r\n|\n|\r)/gm, "");
  tl = $(target);
  res = {};
  Object.keys(tl).forEach(function(key) {
    bool = false;
    if (typeof(tl[key]) == "object") {
      if(tl[key].hasChildNodes()) {
        aes_var = tl[key].children[0].textContent;
        aes_value = tl[key].children[0].getAttribute("data-value");
        if (aes_value != "list()") res[aes_value] = tl[key];
      }
    }
  });
  return res;
};

generate_mapping = function(vars) {
  /*
  Return a JS object with keys set to data levels
  (column names)
  and values to HTML elements representing them (badges)
  */
  vars = vars.replace(/(\r\n|\n|\r)/gm, "");
  tl = $(vars);
  res = {};
  Object.keys(tl).forEach(function(key) {
    bool = false;
    if (typeof(tl[key]) == "object") {
      if(tl[key].hasChildNodes()) {
        aes_var = tl[key].children[0].textContent;
        aes_value = tl[key].children[0].getAttribute("data-value");
        if (aes_value != "list()") res[aes_var] = aes_value;
      }
    }
  });
  return res;
};

$.extend(dragulaBinding, {
  find: function find(scope) {
    return $(scope).find(".shiny-input-dragula");
  },
  initialize: function initialize(el) {
    var $el = $(el);

    var config = $(el).find('script[data-for="' + el.id + '"]');
    config = JSON.parse(config.html());

    var opts = config.options;

    if (!opts.hasOwnProperty("removeOnSpill")) {
      opts.removeOnSpill = false;
    }

    var replaceold = config.replace;
    var replaceIds = config.replaceIds;

    var containersId = [];

    var targetsContainer = config.targets;
    targetsContainer.forEach(function(element) {
      containersId.push(document.querySelector("#" + element));
    });

    var sourceContainer = config.source;
    sourceContainer.forEach(function(element) {
      containersId.push(document.querySelector("#" + element));
    });

    if (replaceold) {
      opts.copy = function(el, source) {
        return source === document.getElementById(sourceContainer);
      };
      opts.isContainer = function(el) {
        return el.classList.contains("target");
      };
    }

    var drake = dragula(containersId, opts).on("dragend", function(el) {
      $el.trigger("change");
    });

    if (replaceold) {
      drake.on("drop", function(el, target) {
        if (target !== document.getElementById(sourceContainer)) {
          if (target !== null) {
            if (replaceIds.indexOf(target.id) >= 0) {
              $(target)
                .children(".dragula-block")
                .remove();
            }
            target.appendChild(el);
          }
        } else {
          $(target)
            .find("#" + $(el).children().attr("id"))
            .parent()
            .remove();
        }
        $el.trigger("change");
      });
    }
  },
  getValue: function getValue(el) {
    var config = $(el).find('script[data-for="' + el.id + '"]');
    config = JSON.parse(config.html());
    var values = {};
    values.source = [];
    values.target = {};
    var source = config.source;
    $("#" + source)
      .find("span.label-dragula")
      .each(function() {
        values.source.push($(this).data("value"));
      });

    var targets = config.targets;
    var targetsname = [];
    targets.forEach(function(element) {
      targetsname.push(element.replace(/.*target-/, ""));
    });

    for (i = 0; i < targetsname.length; i++) {
      values.target[targetsname[i]] = [];
      $("#" + targets[i])
        .find("span.label-dragula")
        .each(function() {
          values.target[targetsname[i]].push($(this).data("value"));
          if (values.target[targetsname[i]].length === 0) {
            values.target[targetsname[i]] = null;
          }
        });
    }

    if (values.source.length === 0) {
      values.source = null;
    }

    //console.log(values);
    return values;
  },
  getType: function() {
    return "esquisse.dragula";
  },
  setValue: function setValue(el, value) {
    console.log(el);
    console.log(value);
    // Not implemented
  },
  subscribe: function subscribe(el, callback) {
    $(el).on("change.dragulaBinding", function(event) {
      callback();
    });
  },
  unsubscribe: function unsubscribe(el) {
    $(el).off(".dragulaBinding");
  },
  receiveMessage: function receiveMessage(el, data) {
    console.log("Message from R received");
    var $el = $(el);
    var config = $(el).find('script[data-for="' + el.id + '"]');
    config = JSON.parse(config.html());
    var targetsContainer = config.targets;
    var sourceContainer = config.source;
    if (data.hasOwnProperty("choices")) {
      
      targetsContainer.forEach(function(element) {
        $("#" + element)
          .children(".dragula-block")
          .remove();
      });
      
      sourceContainer.forEach(function(element) {
        $("#" + element)
          .children(".dragula-block")
          .remove();
        $("#" + element).html(data.choices);
      });
      
    }
    if (data.hasOwnProperty("selected")) {
        Object.keys(data.selected).forEach(function(x) {
          if (x.includes("target-target")) {
            target_key = x;
          }
        });
        
      mapping = generate_mapping(
        data.selected[target_key]
      );
      
      html_elements = extract_vars(
        data.choices
      );
      
      
      targetsContainer.forEach(function(element) {
        console.log(element);
        console.log(data.selected);
        $("#" + element)
          .children(".dragula-block")
          .remove();
        /* $("#" + element).html(data.selected[element]); */
        
        if (find_match(element, mapping)) {
          console.log("element");
          console.log(element);
          console.log("mapping");
          console.log(mapping);
        
          $("#" + element).html(html_elements[find_match(element, mapping)]);
        }
        
      });
    }
    
    $(el).trigger("change");
  },
  getRatePolicy: function getRatePolicy() {
    return {
      policy: "debounce",
      delay: 250
    };
  },
  getState: function getState(el) {}
});

Shiny.inputBindings.register(dragulaBinding, "shiny.dragula");

