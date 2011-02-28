/*
 * jQuery UI Autobox
 * 
 * By Nicolas Presseault
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
 (function( $, undefined ) {
 
 $.widget( "ui.autobox", {
 	options: {
		pattern: /\$\{(\w*)?\}/g,
		reverse_pattern: function( tag ) { return "${" + tag + "}"; },
		value: null
	},
	
	_create: function() {
		this.value(this.options.value !== null ? this.options.value : this.element.val() || 0);
		
		this.element.hide();
		
		this._draw();
		
		this.refresh();
	},
	
	_draw: function() {
		var self = this;
		var id = this.element.attr( "id" );
		
		this.autobox = $( "<div></div>" )
			.addClass( "ui-autobox" )
			.attr( "id", id+"-div" )
			.css( "width", $( this.element ).width() )
			.mousemove(function(e){
				var lastLi = $( "li:last-child", self.autobox);
				var ulWidth = lastLi[0].offsetLeft + lastLi.outerWidth();

				var left = (e.pageX - $(this).offset().left) * (ulWidth - $(this).width() ) / $(this).width();
				$(this).scrollLeft(left);
			})
			.insertAfter( this.element );

		var ul = $( "<ul></ul>" )
			.appendTo( this.autobox )
			
			.html( this.element.val().replace( this.options.pattern, "<li class='ui-autobox-tag'>$1</li>" ) )
			.contents()
			.filter(function() {
				return this.nodeType == 3; // Text node
			})
			.wrap( "<li></li>" )
			.parent()
			.addClass( "ui-autobox-text" )
			.html( function( i, old ) {
				return "<input type='text' value='"+old+"' />";
			});
	},
	
	refresh: function() {
		var self = this;
		
		var uiAutoboxTags = $( "li.ui-autobox-tag:not(:has(span.ui-autobox-tag-content))", this.autobox );
		
		$( uiAutoboxTags )
			.wrapInner( "<span class='ui-autobox-tag-content'></span>" );
		
		var uiAutoboxTagsRemove =  $( "<a href='#'></a>" )
			.addClass( "ui-autobox-tag-remove" )
			.attr( "role", "button" )
			.click(function( event ) {
				event.preventDefault();
				$( this ).parent().remove();
				self.refresh();
			})
			.appendTo( uiAutoboxTags );
		
		var uiAutoboxTagsRemoveIcon = $( "<span></span>" )
			.addClass( "ui-icon ui-icon-close" )
			.appendTo( uiAutoboxTagsRemove );
			
		this._hoverable( uiAutoboxTagsRemove );
		this._focusable( uiAutoboxTagsRemove );
		
		$("li.ui-autobox-spacer", this.autobox).remove();
		var $el = $("li.ui-autobox-text + li.ui-autobox-text", this.autobox);
		$el.prev().find("input").val( $el.prev().find("input").val() + $el.find("input").val() );
		$el.remove();
		
		$( "<li></li>" )
			.addClass( "ui-autobox-spacer" )
			.html("&nbsp;")
			.insertAfter( $("li.ui-autobox-tag + li.ui-autobox-tag", this.autobox).prev() )
			.bind( "click.autobox", function( ) {
				$(this)
					.removeClass( "ui-autobox-spacer" )
					.addClass( "ui-autobox-text" )
					.unbind( "click.autobox" );

				$( "<input type='text' />" )
					.appendTo( this )
					.focus();
			});
			
		
		$("input:text", this.autobox)
			.autoGrowInput({
				comfortZone: 10
			})
			.bind( "blur.autobox", function( ) {
				if ( $(this).val() == "" )
				{
					$(this).parent().remove();
					self.refresh();
				}
			})
			.bind( "change.autobox", function( ) {
				self.refreshValue();
			});
		
		// manually trigger input:text update event for autoGrowInput
		$("input:text", this.autobox).trigger("update");
		this.refreshValue();
		return this;
	},
	
	value: function( newVal ) {
		if (!arguments.length) {
			return this._parse();
		}
		this.option.value = newVal;
		this.element.val( newVal );
	},
	
	_parse: function( ) {
		var self = this;
		var value = "";
		$( "li.ui-autobox-tag, li.ui-autobox-text", this.autobox).each(function() {
			if ( $(this).hasClass( "ui-autobox-tag" ) )
			{
				if ( typeof self.options.reverse_pattern !== "function" )
				{
					throw "Option reverse_pattern must be a function";
				}
				var ret = self.options.reverse_pattern.call(self, $( "span.ui-autobox-tag-content", this).text());
				if ( typeof ret !== "string" )
				{
					throw "Function reverse_pattern did not return a string";
				}
				value += ret;
			}
			else if ( $(this).hasClass( "ui-autobox-text" ) )
			{
				value += $( "input:text", this).val();
			}
		});
		return value;
	},
	
	refreshValue: function() {
		var newValue = this.value();
		
		if (this.element.val() != newValue) {
			this.value( newValue );
			this._trigger( "change" );
		}
		return this;
	},
	
	_destroy: function() {
		this.autobox.remove();
		this.element.show();
		this.autobox = null;
	},
 
 });

 
 }( jQuery ));
 
 /**
 Taken from http://stackoverflow.com/questions/931207/is-there-a-jquery-autogrow-plugin-for-text-fields
 **/
 (function($){

	$.fn.autoGrowInput = function(o) {

		o = $.extend({
			maxWidth: 1000,
			minWidth: 0,
			comfortZone: 70
		}, o);

		this.filter('input:text').each(function(){

			var minWidth = o.minWidth || $(this).width(),
				val = '',
				input = $(this),
				testSubject = $('<div/>').css({
					position: 'absolute',
					top: -9999,
					left: -9999,
					width: 'auto',
					fontSize: input.css('fontSize'),
					fontFamily: input.css('fontFamily'),
					fontWeight: input.css('fontWeight'),
					letterSpacing: input.css('letterSpacing'),
					whiteSpace: 'nowrap'
				}),
				check = function() {

					if (val === (val = input.val())) {return;}

					// Enter new content into testSubject
					var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
					testSubject.html(escaped);

					// Calculate new width + whether to change
					var testerWidth = testSubject.width(),
						newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
						currentWidth = input.width(),
						isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
											 || (newWidth > minWidth && newWidth < o.maxWidth);

					// Animate width
					if (isValidWidthChange) {
						input.width(newWidth);
					}

				};

			testSubject.insertAfter(input);

			$(this).bind('keyup keydown blur update', check);
			
			check();

		});

		return this;

	};

})(jQuery);