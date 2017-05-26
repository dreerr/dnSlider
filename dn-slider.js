/* https://github.com/dreerr/dnSlider
   v1.0 | 20170526
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
      scrollTop: 80,
      highlight: false,
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
      $handle.appendTo($sliderInner);
      $sliderInner.appendTo($element);
      appendRuler();
      // plugin.ruler.children().first().addClass 'active'
      plugin.value = plugin.settings.min;
      setActiveLabel();
      $element.down(function(e) {
        $('html,body').addClass('no-select');
        pressed=true;
        return dragEvent(e);
      });
      $element.move(e => dragEvent(e));
      $element.up(function(e) {
        pressed=false;
        return updateHandle(e);
      });
      $(window).resize(() => updateHandle());
      if (plugin.settings.scroll) { return watchPageScroll(); }
    };


    var dragEvent = function(e) {
      if (pressed) {
        let width = $sliderInner.width();
        let pos = (e.pageX || e.originalEvent.touches[0].pageX) - $sliderInner.offset().left;
        let posTrimmed = Math.min(Math.max(pos, 0), width);
        $handle.css('left', posTrimmed + 'px');
        return setValueByAmount(posTrimmed/width, true);
      }
    };

    var setValueByAmount = function(amount, propagate) {
      let range = Math.abs(Math.abs(plugin.settings.min) - Math.abs(plugin.settings.max));
      let value = Math.round(plugin.settings.min + (range*plugin.settings.step*amount));
      if (value!==plugin.value) {
        plugin.value = value;
        setActiveLabel();
        return changeByUser();
      }
    };

    var updateHandle = function() {
      let range = Math.abs(Math.abs(plugin.settings.min) - Math.abs(plugin.settings.max));
      let amount = Math.abs(plugin.value-plugin.settings.min)/range;
      log(amount);
      // Issue with subpixel :(
      return $handle.css('left', (amount*$sliderInner.width())+'px');
    };

    var setActiveLabel = function() {
      $ruler.children().removeClass('active sibling');
      let active = $ruler.children(`[data-value='${plugin.value}']`);
      active.addClass('active');
      active.prev().addClass('sibling');
      return active.next().addClass('sibling');
    };

    var changeByUser = function() {
      if (plugin.settings.scroll) { pageScrollToValue(); }
      return plugin.settings.onChange($element);
    };

    var pageScrollToValue = function() {
      let target = $(`${plugin.settings.scrollTargetClass}[${plugin.settings.scrollTargetAttr}=${plugin.value}]`);
      if (target.length) {
        clearTimeout(plugin.scrollTimer);
        return plugin.scrollTimer = setTimeout(function() {
          animating = true;
          return $('html,body').animate(
            {scrollTop: target.offset().top - plugin.settings.scrollTop}
          , 1000, () => animating = false);
        }
        , 500);
      }
    };

    var watchPageScroll = function() {
      let scrollItems = $(plugin.settings.scrollTargetClass);
      if (scrollItems.length) {
        return $(window).scroll(function() {
          if (!pressed && !animating) {
            let fromTop = $(this).scrollTop();
            let cur = scrollItems.map(function() {
              if($(this).offset().top >= fromTop) {
                return this;
              }
            });
            if (cur.length===0) { cur = scrollItems.last(); }
            let scroll_value=cur.attr(plugin.settings.scrollTargetAttr);
            return plugin.setValue(scroll_value);
          }
        });
      }
    };



    var appendRuler = function() {
      let range = "";
      let highlightItems = [];
      if (plugin.settings.scroll && plugin.settings.highlight) {
        let scrollItems = $(plugin.settings.scrollTargetClass);
        $sliderInner.addClass('highlight-active');
        highlightItems = scrollItems.map(function() {
          return $(this).attr(plugin.settings.scrollTargetAttr);
        });
      }
      let i = plugin.settings.min;
      while (plugin.settings.step > 0 ? i<=plugin.settings.max : i>= plugin.settings.max) {
        let makeHighlight = Array.from(highlightItems).includes(i.toString()) ? ' class="highlight"' : '';
        range += `<span data-value='${i}'${makeHighlight}></span> `; // don't remove whitespace!
        i += plugin.settings.step;
      }
      $ruler.html(range);
      return $sliderInner.prepend($ruler);
    };

    plugin.setValue = function(value) {
      if (value!==plugin.value) {
        plugin.value=value;
        setActiveLabel();
        return updateHandle();
      }
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
      return e.preventDefault();
    });
    this.bind('mousedown', function(e) {
      return func.call(this, e);
    });
    return this;
  };
  $.fn.move = function(func) {
    this.bind('touchmove', function(e) {
      func.call(this, e);
      e.stopPropagation();
      return e.preventDefault();
    });
    this.bind('mousemove', function(e) {
      return func.call(this, e);
    });
    return this;
  };
  $.fn.up = function(func) {
    this.bind('touchend', function(e) {
      func.call(this, e);
      // e.stopPropagation()
      return e.preventDefault();
    });
    this.bind('mouseup', function(e) {
      return func.call(this, e);
    });
    return this;
  };

  return $.fn.dnSlider = function(options) {
    return this.each(function() {
      if (undefined === $(this).data('dnSlider')) {
        let plugin = new $.dnSlider(this, options);
        return $(this).data('dnSlider', plugin);
      }});
  };
})(jQuery);