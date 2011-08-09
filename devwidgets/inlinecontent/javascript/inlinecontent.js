
/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*
 * Dependencies
 *
 * /dev/lib/misc/trimpath.template.js (TrimpathTemplates)
 */

require(["jquery", "sakai/sakai.api.core", "sakai/sakai.api.widgets"], function($, sakai, sakaiWidgetsAPI) {

    /**
     * @name sakai_global.inlinecontent
     *
     * @class inlinecontent
     *
     * @description
     * Inline Content widget
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.inlinecontent = function(tuid, showSettings){


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        var rootel = $("#" + tuid);
        var json = false;
 
        // Links and labels
        var inlinecontent = "#inlinecontent";
        var inlinecontentSettings = inlinecontent + "_settings";
        var inlinecontentSettingsCancel = inlinecontentSettings + "_cancel";
        var inlinecontentSettingsInsert = inlinecontentSettings + "_insert"
        var inlinecontentSettingsremoteurl = inlinecontentSettings + "_remoteurl";
        var inlinecontentSettingsOption1 = inlinecontentSettings + "_option1";
        var inlinecontentSettingsOption2 = inlinecontentSettings + "_option2";
        var inlinecontentSettingsOption3 = inlinecontentSettings + "_option3";

        // Containers
        var inlinecontentMainContainer = inlinecontent + "_main_container";
        var inlinecontentPreviewContainer = inlinecontent + "_settings_preview";

        // Classes
        var inlinecontentSettingsWidthUnitClass = ".inlinecontent_settings_width_unit";
        var inlinecontentSettingsWidthUnitSelectedClass = "inlinecontent_settings_width_unit_selected";

        // Templates
        var $inlinecontentSettingsTemplate = $("#inlinecontent_settings_template", rootel);
        var $inlinecontentPreviewErrorTemplate = $("#inlinecontent_preview_error_template", rootel);
        
        var safeUrlREs = [
        	/http:\/\/www.cam.ac.uk(.*)/,
        ];
        
        var proxyUrls = [
        	"/var/proxy/ucam/www_cam_ac_uk_base?q={1}"	
        ];
        
        var cleanContentREs = [
                /<!-- end group breadcrumb -->(.|\n|\r)*?<\/body>/m
        ];

        ///////////////////////
        // Utility functions //
        ///////////////////////

        
        var getSaneUrl = function(userUrl) {
        	for ( var i = 0; i < safeUrlREs.length; i++) {
        		var matchUrl = safeUrlREs[i].exec(userUrl);
        		if ( matchUrl ) {
        			return proxyUrls[i].replace(/\{(\d+)\}/g, function() {
        				return encodeURIComponent(matchUrl[arguments[1]]);
        			});
        		}
        	}
        	return "";
        };

        //////////////////////
        // Render functions //
        //////////////////////
        



        /**
         * Render the html of the inlinecontentsettings
         */
        var renderRemoteContentSettings = function(){
            if (json) {
            	json._MODIFIERS = null;
                $(inlinecontentSettings,rootel).html(sakai.api.Util.TemplateRenderer($inlinecontentSettingsTemplate, json));
            }
        };

        var extractContent = function(content){
        	for ( var i = 0; i < cleanContentREs.length; i++) {
        		var match = cleanContentREs[i].exec(content);
        		if ( match !== null ) {
        			return match[0];
        		}
        	}
        	return content;
        };
 
        //////////////////////
        // Global functions //
        //////////////////////

        /**
         * Display the iframe in normal mode
         * @param {Object} parameters JSON object that contains the necessary information for the iframe
         */
        var displayRemoteContent = function(parameters, preview){
            json = parameters;
            if ( json.saneurl !== "") {
                $.ajax({
                    type: "GET",
                    url: json.saneurl,
                    success: function(data) {
                    	if ( preview ) {
                        	$(inlinecontentPreviewContainer, rootel).html(sakai.api.Util.Security.saneHTML(extractContent(data)));
                            $(inlinecontentPreviewContainer, rootel).show();                    		
                    	} else {
                        	$(inlinecontentMainContainer, rootel).html(sakai.api.Util.Security.saneHTML(extractContent(data)));
                            $(inlinecontentMainContainer, rootel).show();
                    	}

                    },
                    error: function(xhr, status, e) {
                    	if (preview ) {
                    		var loadresult = {};
                    		loadresult.saneurl = json.saneurl;
                    		loadresult.cause = e;
                        	$(inlinecontentPreviewContainer,rootel).html(sakai.api.Util.TemplateRenderer($inlinecontentPreviewErrorTemplate, loadresult));
    	                    sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("inlinecontent", false, "ERROR_LOADING_CONTENT"),
    	                            sakai.api.Util.notification.type.ERROR);
                    	} else{
                            displaySettings(null, false);                    		
                    	}
                    }
                });            	
            }
        };

        /**
         * Save the inlinecontent to the jcr
         */
        var saveRemoteContent = function(){
            var  saveContentAjax = function(json_data) {
                var url = sakaiWidgetsAPI.widgetLoader.widgets[tuid].placement;
                $.ajax({
                    type: "POST",
                    url: url,
                    data: json_data,
                    success: function(data) { 
                        displayRemoteContent(json_data, false);
                        sakai.api.Widgets.Container.informFinish(tuid, "inlinecontent");
                    }
                }); 
            };

            if (json.saneurl !== "") {
                json["sling:resourceType"] = "sakai/inlinecontent";
                json._MODIFIERS = null; // trimpath garbage - probably need a more selective way of saving data
                saveContentAjax(json);
            }
            else {
                sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("inlinecontent", false, "PLEASE_SPECIFY_A_URL"),
                                                 sakai.api.Util.notification.type.ERROR);
            }
        };


        //////////////
        // Bindings //
        //////////////

        /*
         * Add binding to all the elements
         */
        var addBinding = function(){

            // Change the url for the iFrame
        	if ( $(inlinecontentSettingsremoteurl,rootel).length ) {
	            $(inlinecontentSettingsremoteurl,rootel).change(function(){
	            	json.remoteurl = $(this).val();
	                var urlValue = getSaneUrl(json.remoteurl);
	                if (urlValue !== "") {	
	                    json.saneurl = urlValue;
	                } else {
	                	json.saneurl = ""
	                    sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("inlinecontent", false, "PLEASE_SPECIFY_A_URL"),
	                            sakai.api.Util.notification.type.ERROR);
	                }
	            });
        	}
        	
        	
        	
        	if ( $(inlinecontentSettingsOption1,rootel).length && 
        			$(inlinecontentSettingsOption2,rootel).length && 
        			    $(inlinecontentSettingsOption3,rootel).length ) {
                $(inlinecontentSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.option2 = "";
                	json.option3 = "";
                	json.saneurl = "";
                    var template = $("#inlinecontent_settings_option2_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                    	$(inlinecontentSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
                    	$(inlinecontentSettingsOption3,rootel).html("");            
                    } else {
                    	json.saneurl = $(this).val();
                    	$(inlinecontentSettingsOption3,rootel).html("");
                        displayRemoteContent(json, true);
                    }
                });
                $(inlinecontentSettingsOption2,rootel).change(function(){
                  	json.option2 = $(this).val();
                	json.option3 = "";
                	json.saneurl = "";
                    var template = $("#inlinecontent_settings_option3_"+json.option2+"_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                        alert("Template 3 is "+template+" "+template.length+" "+"#inlinecontent_settings_option3_"+json.option2+"_"+json.option1+"_template"+document.getElementById("inlinecontent_settings_option3_"+json.option2+"_"+json.option1+"_template"));
                    	$(inlinecontentSettingsOption3,rootel).html(sakai.api.Util.TemplateRenderer(template, json));                    	
                    } else {
                    	json.saneurl = $(this).val();                    	
                        displayRemoteContent(json, true);
                    }
                });
                $(inlinecontentSettingsOption3).change(function(){
                  	json.option3 = $(this).val();
                    json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });
        	} else if ( $(inlinecontentSettingsOption1,rootel).length 
        			&& $(inlinecontentSettingsOption2,rootel).length  ) {
                $(inlinecontentSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.option2 = "";
                	json.saneurl = "";
                    var template = $("#inlinecontent_settings_option2_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                    	$(inlinecontentSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
                    } else {
                    	json.saneurl = $(this).val();
                        displayRemoteContent(json, true);
                    }
                });
                $(inlinecontentSettingsOption2,rootel).change(function(){
                  	json.option2 = $(this).val();
                	json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });
        	} else if ( $(inlinecontentSettingsOption1,rootel).length ) {
                $(inlinecontentSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });        		
        	}


            // When you push the save button..
            $(inlinecontentSettingsInsert,rootel).click(function(){
                saveRemoteContent();
            });

            // Cancel it
            $(inlinecontentSettingsCancel,rootel).click(function(){
                sakai.api.Widgets.Container.informCancel(tuid, "inlinecontent");
            });

        };


        ///////////////////////
        // Initial functions //
        ///////////////////////

        /**
         * Function that fills in the input fields in the settings tab.
         * @param {Object} parameters A JSON object that contains the necessary information.
         * @param {Boolean} exists Does there exist a previous inlinecontent
         */
        var displaySettings = function(parameters, exists){
            if (exists && (parameters.remoteurl || parameters.option1)) {
                json = parameters;
            }
            else { // use default values
                json = {
                    remoteurl: "",
                    saneurl: ""
                };
            }
            renderRemoteContentSettings();
            addBinding(); // Add binding to the various elements
            $(inlinecontentSettings,rootel).show(); // Show the inlinecontent settings
        };

        /*
         * Is the widget in settings mode or not
         */
        if (showSettings) {
            $(inlinecontentMainContainer,rootel).hide();
            $(inlinecontentSettings,rootel).show();
        }
        else {
            $(inlinecontentSettings,rootel).hide();
            $(inlinecontentMainContainer,rootel).show();
        }

        /**
         * Will fetch the URL and other parameters from the JCR and according to which
         * view we are in, fill in the settings or display an iframe.
         */
        var getRemoteContent = function(showSettings) {
            // We make our own call below at the moment. Unlike most of the widgets
            // we need to interact directly with the LiteBasicLTI servlet. It's 
            // also not a recursive servlet so we can't use the default .infinity.json
            // that is used under the covers for most of the calls.
            var url = sakaiWidgetsAPI.widgetLoader.widgets[tuid].placement + ".json";
            $.ajax({
                type: "GET",
                url: url,
                dataType: 'json',
                success: function(data) {
                    if (showSettings) {
                        displaySettings(data,true);
                    }
                    else {
                        displayRemoteContent(data, false);
                    } 
                },
                error: function(xhr, status, e) {
                    displaySettings(null, false);
                }
            });
        };
        
        getRemoteContent(showSettings);
    };

    sakai.api.Widgets.widgetLoader.informOnLoad("inlinecontent");
});
