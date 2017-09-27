/*! https://github.com/dreerr/dnSlider
   v1.1 | 20170923
   License: All rights reserved
   */

   (function($) {
    $.dnSlider = function(element, options) {
      let defaults = {
        min: 0,
        max: 100,
        step: 1,
        scroll: true,
        scrollTargetClass: '.year-container',
        scrollTargetAttr: 'data-year',
        orientation: 'bottom',
        scrollTop: 80,
        highlight: false,
        async: false,
        debug: false,
        onChange(e) {}
      };

      let plugin = this;
      plugin.settings = {};
      let $element = $(element);
      let $sliderInner = $('<div class="slider-inner"/>');
      let $ruler = $('<div class="slider-ruler" unselectable="on"/>');
      let $handle = $('<div class="slider-handle" />');
      let pressed = false;
      let animating = false;

      plugin.init = function() {
        plugin.settings = $.extend({}, defaults, options, $element.data());
        log(plugin.settings);
        $element.addClass(plugin.settings.orientation);
        $handle.appendTo($sliderInner);
        $sliderInner.appendTo($element);

      plugin.reloadScrollItems(); // WILL INIT ALL

      // HANDLERS
      $element.down(function(e) {
        $('html,body').addClass('no-select');
        pressed=true;
        dragEvent(e);
      });
      $element.move(e => dragEvent(e));
      $element.up(function(e) {
        pressed=false;
        updateHandle(e);
      });
      $(window).resize(() => updateHandle());
      if (plugin.settings.scroll) {
        $(window).scroll(() => watchPageScroll());
      }
    };

    plugin.reloadScrollItems = function() {
      plugin.scrollItems = $(plugin.settings.scrollTargetClass+':visible');
      updateRuler();
      plugin.value = plugin.items[0];
      setActiveLabel();
      watchPageScroll();
    }

    plugin.setValue = function(value) {
      if (value!==plugin.value) {
        plugin.value=value;
        setActiveLabel();
        updateHandle();
      }
    };

    var dragEvent = function(e) {
      if (pressed) {
        if (plugin.settings.orientation=='bottom') {
          let width = $sliderInner.width();
          let pos = (e.pageX || e.originalEvent.touches[0].pageX) - $sliderInner.offset().left;
          let posTrimmed = Math.min(Math.max(pos, 0), width);
          $handle.css('left', posTrimmed + 'px');
          setValueByAmount(posTrimmed/width, true);
        } else {
          let height = $sliderInner.height();
          let pos = (e.pageY || e.originalEvent.touches[0].pageY) - $sliderInner.offset().top;
          let posTrimmed = Math.min(Math.max(pos, 0), height);
          $handle.css('top', posTrimmed + 'px');
          setValueByAmount(posTrimmed/height, true);
        }
      }
    };

    var setValueByAmount = function(amount) {
      let pos = Math.round(amount*(plugin.items.length-1));
      let value = plugin.items[pos];
      if (value!==plugin.value) {
        plugin.value = value;
        setActiveLabel();
        changeByUser();
      }
    };

    var updateHandle = function() {
      let amount = plugin.items.indexOf(plugin.value)/(plugin.items.length-1);
      if (plugin.settings.orientation=='bottom') {
        $handle.css('left', (amount*$sliderInner.width())+'px');
      } else {
        $handle.css('top', (amount*$sliderInner.height())+'px');
      }

    };

    var setActiveLabel = function() {
      $ruler.children('.active, .sibling').removeClass('active sibling');
      let active = $ruler.children(`[data-value='${plugin.value}']`);
      active.addClass('active');
      active.prev().addClass('sibling');
      active.next().addClass('sibling');
    };

    var changeByUser = function() {
      if (plugin.settings.scroll) { pageScrollToValue(); }
      plugin.settings.onChange($element);
    };

    var pageScrollToValue = function() {
      let target = $(`${plugin.settings.scrollTargetClass}:visible[${plugin.settings.scrollTargetAttr}=${plugin.value}]`);
      if (target.length) {
        clearTimeout(plugin.scrollTimer);
        plugin.scrollTimer = setTimeout(function() {
          animating = true;
          $('html,body').animate(
            {scrollTop: target.offset().top - plugin.settings.scrollTop}
            , 1000, () => animating = false);
        }
        , 500);
      }
    };

    var watchPageScroll = function() {
      if (plugin.scrollItems.length) {
        if (!pressed && !animating) {
          let fromTop = $(this).scrollTop();
          let cur = plugin.scrollItems.map(function() {
            if($(this).offset().top + $(this).height() >= fromTop) {
              return this;
            }
          });
          if (cur.length===0) { cur = plugin.scrollItems.last(); }
          let scroll_value=cur.attr(plugin.settings.scrollTargetAttr);
          plugin.setValue(scroll_value);
        }
      }
    };

    var updateRuler = function() {
      let range = "";
      plugin.items = [];
      let highlightItems = plugin.scrollItems.map(function() {
        return $(this).attr(plugin.settings.scrollTargetAttr);
      }).toArray();
      if (plugin.settings.highlight) {
        $element.addClass('highlight-all');
      }
      if (plugin.settings.async) {
        plugin.items = highlightItems;
        $element.addClass('show-all');
      } else {
        let value = plugin.settings.min;
        while (plugin.settings.step > 0 ? value<=plugin.settings.max : value>= plugin.settings.max) {
          plugin.items.push(value.toString());
          value += plugin.settings.step;
        }
      }
      $(plugin.items).each(function(index, value) {
        let makeHighlight = highlightItems.indexOf(value)!==-1 ? ' class="highlight"' : '';
        let segment = 100.0/(plugin.items.length-1)*index;
        let pos = `${plugin.settings.orientation=="bottom" ? "left":"top"}: ${segment}%`;
        range += `<span data-value='${value}'${makeHighlight} style='${pos}'></span>`;
      });
      $ruler.html(range);
      $sliderInner.prepend($ruler);
    };

    var log = function(msg) {
      if (plugin.settings.debug) { return (typeof console !== 'undefined' && console !== null ? console.log(msg) : undefined); }
    };

    plugin.init();
    return this;
  };

  $.fn.down = function(func) {
    this.bind('touchstart', function(e) {
      func.call(this, e);
      e.stopPropagation();
      e.preventDefault();
    });
    this.bind('mousedown', function(e) {
      func.call(this, e);
    });
    return this;
  };
  $.fn.move = function(func) {
    this.bind('touchmove', function(e) {
      func.call(this, e);
      e.stopPropagation();
      e.preventDefault();
    });
    this.bind('mousemove', function(e) {
      return func.call(this, e);
    });
    return this;
  };
  $.fn.up = function(func) {
    this.bind('touchend', function(e) {
      func.call(this, e);
      e.preventDefault();
    });
    this.bind('mouseup', function(e) {
      func.call(this, e);
    });
    return this;
  };
  $.fn.dnSlider = function(options) {
    return this.each(function() {
      if (undefined === $(this).data('dnSlider')) {
        let plugin = new $.dnSlider(this, options);
        $(this).data('dnSlider', plugin);
      }});
  };
})(jQuery);