
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
     * @name sakai_global.cued_syllabus
     *
     * @class cued_syllabus
     *
     * @description
     * CUED Syllabus widget
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.cued_syllabus = function(tuid, showSettings){


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        var rootel = $("#" + tuid);
        var json = false;
 
        // Links and labels
        var cued_syllabus = "#cued_syllabus";
        var cued_syllabusSettings = cued_syllabus + "_settings";
        var cued_syllabusSettingsCancel = cued_syllabusSettings + "_cancel";
        var cued_syllabusSettingsInsert = cued_syllabusSettings + "_insert"
        var cued_syllabusSettingsremoteurl = cued_syllabusSettings + "_remoteurl";
        var cued_syllabusSettingsOption1 = cued_syllabusSettings + "_option1";
        var cued_syllabusSettingsOption2 = cued_syllabusSettings + "_option2";
        var cued_syllabusSettingsOption3 = cued_syllabusSettings + "_option3";

        // Containers
        var cued_syllabusMainContainer = cued_syllabus + "_main_container";
        var cued_syllabusPreviewContainer = cued_syllabus + "_settings_preview";

        // Classes
        var cued_syllabusSettingsWidthUnitClass = ".cued_syllabus_settings_width_unit";
        var cued_syllabusSettingsWidthUnitSelectedClass = "cued_syllabus_settings_width_unit_selected";

        // Templates
        var $cued_syllabusSettingsTemplate = $("#cued_syllabus_settings_template", rootel);
        var $cued_syllabusPreviewErrorTemplate = $("#cued_syllabus_preview_error_template", rootel);
        
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
         * Render the html of the cued_syllabussettings
         */
        var renderRemoteContentSettings = function(){
            if (json) {
            	json._MODIFIERS = null;
                $(cued_syllabusSettings,rootel).html(sakai.api.Util.TemplateRenderer($cued_syllabusSettingsTemplate, json));
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
                        	$(cued_syllabusPreviewContainer, rootel).html(sakai.api.Util.Security.saneHTML(extractContent(data)));
                            $(cued_syllabusPreviewContainer, rootel).show();                    		
                    	} else {
                        	$(cued_syllabusMainContainer, rootel).html(sakai.api.Util.Security.saneHTML(extractContent(data)));
                            $(cued_syllabusMainContainer, rootel).show();
                    	}

                    },
                    error: function(xhr, status, e) {
                    	if (preview ) {
                    		var loadresult = {};
                    		loadresult.saneurl = json.saneurl;
                    		loadresult.cause = e;
                        	$(cued_syllabusPreviewContainer,rootel).html(sakai.api.Util.TemplateRenderer($cued_syllabusPreviewErrorTemplate, loadresult));
    	                    sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("cued_syllabus", false, "ERROR_LOADING_CONTENT"),
    	                            sakai.api.Util.notification.type.ERROR);
                    	} else{
                            displaySettings(null, false);                    		
                    	}
                    }
                });            	
            }
        };

        /**
         * Save the cued_syllabus to the jcr
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
                        sakai.api.Widgets.Container.informFinish(tuid, "cued_syllabus");
                    }
                }); 
            };

            if (json.saneurl !== "") {
                json["sling:resourceType"] = "sakai/cued_syllabus";
                json._MODIFIERS = null; // trimpath garbage - probably need a more selective way of saving data
                saveContentAjax(json);
            }
            else {
                sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("cued_syllabus", false, "PLEASE_SPECIFY_A_URL"),
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
        	if ( $(cued_syllabusSettingsremoteurl,rootel).length ) {
	            $(cued_syllabusSettingsremoteurl,rootel).change(function(){
	            	json.remoteurl = $(this).val();
	                var urlValue = getSaneUrl(json.remoteurl);
	                if (urlValue !== "") {	
	                    json.saneurl = urlValue;
	                } else {
	                	json.saneurl = ""
	                    sakai.api.Util.notification.show("", sakai.api.i18n.Widgets.getValueForKey("cued_syllabus", false, "PLEASE_SPECIFY_A_URL"),
	                            sakai.api.Util.notification.type.ERROR);
	                }
	            });
        	}
        	
        	
        	
        	if ( $(cued_syllabusSettingsOption1,rootel).length && 
        			$(cued_syllabusSettingsOption2,rootel).length && 
        			    $(cued_syllabusSettingsOption3,rootel).length ) {
                $(cued_syllabusSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.option2 = "";
                	json.option3 = "";
                	json.saneurl = "";
                    var template = $("#cued_syllabus_settings_option2_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                    	$(cued_syllabusSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
                    	$(cued_syllabusSettingsOption3,rootel).html("");            
                    } else {
                    	json.saneurl = $(this).val();
                    	$(cued_syllabusSettingsOption3,rootel).html("");
                        displayRemoteContent(json, true);
                    }
                });
                $(cued_syllabusSettingsOption2,rootel).change(function(){
                  	json.option2 = $(this).val();
                	json.option3 = "";
                	json.saneurl = "";
                    var template = $("#cued_syllabus_settings_option3_"+json.option2+"_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                        alert("Template 3 is "+template+" "+template.length+" "+"#cued_syllabus_settings_option3_"+json.option2+"_"+json.option1+"_template"+document.getElementById("cued_syllabus_settings_option3_"+json.option2+"_"+json.option1+"_template"));
                    	$(cued_syllabusSettingsOption3,rootel).html(sakai.api.Util.TemplateRenderer(template, json));                    	
                    } else {
                    	json.saneurl = $(this).val();                    	
                        displayRemoteContent(json, true);
                    }
                });
                $(cued_syllabusSettingsOption3).change(function(){
                  	json.option3 = $(this).val();
                    json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });
        	} else if ( $(cued_syllabusSettingsOption1,rootel).length 
        			&& $(cued_syllabusSettingsOption2,rootel).length  ) {
                $(cued_syllabusSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.option2 = "";
                	json.saneurl = "";
                    var template = $("#cued_syllabus_settings_option2_"+json.option1+"_template", rootel);
                    if ( template.length ) {
                    	$(cued_syllabusSettingsOption2,rootel).html(sakai.api.Util.TemplateRenderer(template, json));
                    } else {
                    	json.saneurl = $(this).val();
                        displayRemoteContent(json, true);
                    }
                });
                $(cued_syllabusSettingsOption2,rootel).change(function(){
                  	json.option2 = $(this).val();
                	json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });
        	} else if ( $(cued_syllabusSettingsOption1,rootel).length ) {
                $(cued_syllabusSettingsOption1,rootel).change(function(){                
                	json.option1 = $(this).val();
                	json.saneurl = $(this).val();
                    displayRemoteContent(json, true);
                });        		
        	}


            // When you push the save button..
            $(cued_syllabusSettingsInsert,rootel).click(function(){
                saveRemoteContent();
            });

            // Cancel it
            $(cued_syllabusSettingsCancel,rootel).click(function(){
                sakai.api.Widgets.Container.informCancel(tuid, "cued_syllabus");
            });

        };


        ///////////////////////
        // Initial functions //
        ///////////////////////

        /**
         * Function that fills in the input fields in the settings tab.
         * @param {Object} parameters A JSON object that contains the necessary information.
         * @param {Boolean} exists Does there exist a previous cued_syllabus
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
            $(cued_syllabusSettings,rootel).show(); // Show the cued_syllabus settings
        };

        /*
         * Is the widget in settings mode or not
         */
        if (showSettings) {
            $(cued_syllabusMainContainer,rootel).hide();
            $(cued_syllabusSettings,rootel).show();
        }
        else {
            $(cued_syllabusSettings,rootel).hide();
            $(cued_syllabusMainContainer,rootel).show();
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

    sakai.api.Widgets.widgetLoader.informOnLoad("cued_syllabus");
});
