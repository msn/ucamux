
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
     * @name sakai_global.cuedsyllabus
     *
     * @class cuedsyllabus
     *
     * @description
     * CUED Syllabus widget
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.cuedsyllabus = function(tuid, showSettings){


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        var rootel = $("#" + tuid);
        var json = false;
 
        // Links and labels
        var cuedsyllabus = "#cuedsyllabus";
        var cuedsyllabusSettings = cuedsyllabus + "_settings";
        var cuedsyllabusSettingsCancel = cuedsyllabusSettings + "_cancel";
        var cuedsyllabusSettingsInsert = cuedsyllabusSettings + "_insert"
        var cuedsyllabusSettingsremoteurl = cuedsyllabusSettings + "_remoteurl";
        var cuedsyllabusSettingsOption1 = cuedsyllabusSettings + "_option1";
        var cuedsyllabusSettingsOption2 = cuedsyllabusSettings + "_option2";
        var cuedsyllabusSettingsOption3 = cuedsyllabusSettings + "_option3";

        // Containers
        var cuedsyllabusMainContainer = cuedsyllabus + "_main_container";
        var cuedsyllabusPreviewContainer = cuedsyllabus + "_settings_preview";

        // Classes
        var cuedsyllabusSettingsWidthUnitClass = ".cuedsyllabus_settings_width_unit";
        var cuedsyllabusSettingsWidthUnitSelectedClass = "cuedsyllabus_settings_width_unit_selected";

        // Templates
        var $cuedsyllabusSettingsTemplate = $("#cuedsyllabus_settings_template", rootel);
        var $cuedsyllabusPreviewErrorTemplate = $("#cuedsyllabus_preview_error_template", rootel);
        
        var safeUrlREs = [
        	/http:\/\/www.cam.ac.uk(.*)/,
        ];
        
        var proxyUrls = [
        	"/var/proxy/ucam/www_cam_ac_uk_base?q={1}"	
        ];
        
        var cleanContentREs = [
                /<!-- end group breadcrumb -->(.|\n|\r)*?<\/body>/m
        ];

        var defaultUrl = "/var/proxy/ucam/eng_teaching?y=" +
            sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "DEFAULT_YEAR") + "&c=" +
            sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "DEFAULT_CLASS");
                        

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
         * Render the html of the cuedsyllabussettings
         */
        var renderRemoteContentSettings = function(){
            if (json) {
            	json._MODIFIERS = null;
              $(cuedsyllabusSettings,rootel).html(sakai.api.Util.TemplateRenderer($cuedsyllabusSettingsTemplate, json));
              var template = $("#cuedsyllabus_settings_option2_"+json.option1+"_template", rootel);
              $(cuedsyllabusSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
              // Select the year in the drop down that was previously chosen:
              $("#cuedsyllabus_settings_option1_" + json.option1).attr("selected", "selected");
              // Extract the class code:
              var selectValue = json.option2;
              var equalsPosition = selectValue.lastIndexOf("=") + 1;
              var classCode = selectValue.slice( equalsPosition );
              // Select the course (class) in the drop down that was previously chosen:
              $("#cuedsyllabus_settings_option2_" + json.option1 + "_" + classCode).attr("selected", "selected");
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
                        	$(cuedsyllabusPreviewContainer, rootel).html(sakai.api.Util.Security.saneHTML(extractContent(data)));
                            $(cuedsyllabusPreviewContainer, rootel).show();                    		
                    	} else {
                        	$(cuedsyllabusMainContainer, rootel).html(sakai.api.Util.Security.saneHTML(extractContent(data)));
                            $(cuedsyllabusMainContainer, rootel).show();
                    	}

                    },
                    error: function(xhr, status, e) {
                    	if (preview ) {
                    		var loadresult = {};
                    		loadresult.saneurl = json.saneurl;
                    		loadresult.cause = e;
                        	$(cuedsyllabusPreviewContainer,rootel).html(sakai.api.Util.TemplateRenderer($cuedsyllabusPreviewErrorTemplate, loadresult));
    	                    sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "ERROR_LOADING_CONTENT"),
    	                            sakai.api.Util.notification.type.ERROR);
                    	} else{
                            displaySettings(null, false);                    		
                    	}
                    }
                });            	
            }
        };

        /**
         * Save the cuedsyllabus to the jcr
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
                        sakai.api.Widgets.Container.informFinish(tuid, "cuedsyllabus");
                    }
                }); 
            };

            if (json.saneurl !== "") {
                json["sling:resourceType"] = "sakai/cuedsyllabus";
                json._MODIFIERS = null; // trimpath garbage - probably need a more selective way of saving data
                saveContentAjax(json);
            }
            else {
                sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "PLEASE_SPECIFY_A_URL"),
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
        	if ( $(cuedsyllabusSettingsremoteurl,rootel).length ) {
	            $(cuedsyllabusSettingsremoteurl,rootel).change(function(){
	            	json.remoteurl = $(this).val();
	                var urlValue = getSaneUrl(json.remoteurl);
	                if (urlValue !== "") {	
	                    json.saneurl = urlValue;
	                } else {
	                	json.saneurl = ""
	                    sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "PLEASE_SPECIFY_A_URL"),
	                            sakai.api.Util.notification.type.ERROR);
	                }
	            });
        	}
        	
        	
        	
        	if ( $(cuedsyllabusSettingsOption1,rootel).length && 
        			$(cuedsyllabusSettingsOption2,rootel).length && 
        			    $(cuedsyllabusSettingsOption3,rootel).length ) {
                $(cuedsyllabusSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.option2 = "";
                	json.option3 = "";
                	json.saneurl = "";
                    var template = $("#cuedsyllabus_settings_option2_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                    	$(cuedsyllabusSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
                    	$(cuedsyllabusSettingsOption3,rootel).html("");            
                    } else {
                    	json.saneurl = $(this).val();
                    	$(cuedsyllabusSettingsOption3,rootel).html("");
                        displayRemoteContent(json, true);
                    }
                });
                $(cuedsyllabusSettingsOption2,rootel).change(function(){
                  	json.option2 = $(this).val();
                	json.option3 = "";
                	json.saneurl = "";
                    var template = $("#cuedsyllabus_settings_option3_"+json.option2+"_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                        alert("Template 3 is "+template+" "+template.length+" "+"#cuedsyllabus_settings_option3_"+json.option2+"_"+json.option1+"_template"+document.getElementById("cuedsyllabus_settings_option3_"+json.option2+"_"+json.option1+"_template"));
                    	$(cuedsyllabusSettingsOption3,rootel).html(sakai.api.Util.TemplateRenderer(template, json));                    	
                    } else {
                    	json.saneurl = $(this).val();                    	
                        displayRemoteContent(json, true);
                    }
                });
                $(cuedsyllabusSettingsOption3).change(function(){
                  	json.option3 = $(this).val();
                    json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });
        	} else if ( $(cuedsyllabusSettingsOption1,rootel).length 
        			&& $(cuedsyllabusSettingsOption2,rootel).length  ) {
                $(cuedsyllabusSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.option2 = "";
                	json.saneurl = "";
                    var template = $("#cuedsyllabus_settings_option2_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                    	$(cuedsyllabusSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
                    } else {
                    	json.saneurl = $(this).val();
                        displayRemoteContent(json, true);
                    }
                });
                $(cuedsyllabusSettingsOption2,rootel).change(function(){
                  	json.option2 = $(this).val();
                	json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });
        	} else if ( $(cuedsyllabusSettingsOption1,rootel).length ) {
                $(cuedsyllabusSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });        		
        	}


            // When you push the save button..
            $(cuedsyllabusSettingsInsert,rootel).click(function(){
                saveRemoteContent();
            });

            // Cancel it
            $(cuedsyllabusSettingsCancel,rootel).click(function(){
                sakai.api.Widgets.Container.informCancel(tuid, "cuedsyllabus");
            });

        };


        ///////////////////////
        // Initial functions //
        ///////////////////////

        /**
         * Function that fills in the input fields in the settings tab.
         * @param {Object} parameters A JSON object that contains the necessary information.
         * @param {Boolean} exists Does there exist a previous cuedsyllabus
         */
        var displaySettings = function(parameters, exists){
            if (exists && (parameters.remoteurl || parameters.option1)) {
                json = parameters;
            }
            else { // use default values
                json = {
                    saneurl: defaultUrl,
                    remoteurl: "",
                    option1: sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "DEFAULT_YEAR"),
                    option2: defaultUrl
                };
            }
            renderRemoteContentSettings();
            addBinding(); // Add binding to the various elements
            $(cuedsyllabusSettingsOption2,rootel).show(); // Show the cuedsyllabus settings
            displayRemoteContent(json, true); // Render the currently selected page
        };

        /*
         * Is the widget in settings mode or not
         */
        if (showSettings) {
            $(cuedsyllabusMainContainer,rootel).hide();
            $(cuedsyllabusSettings,rootel).show();
        }
        else {
            $(cuedsyllabusSettings,rootel).hide();
            $(cuedsyllabusMainContainer,rootel).show();
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
                    // No values have been set for the widget at all, so set them
                    // to the default values:
                    json = {
                        saneurl: defaultUrl,
                        remoteurl: "",
                        option1: sakai.api.i18n.Widgets.getValueForKey("cuedsyllabus", false, "DEFAULT_YEAR"),
                        option2: defaultUrl
                    };
                    saveRemoteContent();
                }
            });
        };
        
        getRemoteContent(showSettings);
    };

    sakai.api.Widgets.widgetLoader.informOnLoad("cuedsyllabus");
});
