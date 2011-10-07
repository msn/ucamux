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
 * /dev/lib/jquery/plugins/jqmodal.sakai-edited.js
 */

/*global, fluid, window, $ */

require(["jquery", "sakai/sakai.api.core"], function($, sakai) {

    /**
     * @name sakai_global.acceptterms
     *
     * @class acceptterms
     *
     * @description
     * Deletecontent widget
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.acceptterms = function(tuid, showSettings){


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////


        ///////////////////
        // CSS Selectors //
        ///////////////////

        var $rootel = $("#" + tuid);

        var $acceptterms_action_accept = $("#acceptterms_action_accept", $rootel);
        var $acceptterms_dialog = $("#acceptterms_dialog", $rootel);
        var $acceptterms_form = $("#acceptterms_form", $rootel);
        var $acceptterms_form_heading = $("h4:eq(0)", $acceptterms_form);
        var $acceptterms_form_note = $("span:eq(0)", $acceptterms_form);
        var $acceptterms_gn = $("#acceptterms_gn", $rootel);
        var $acceptterms_sn = $("#acceptterms_sn", $rootel);

        // Messages
        var $acceptterms_accepted = $("#acceptterms_accepted", $rootel);
        var $acceptterms_not_accepted = $("#acceptterms_not_accepted", $rootel);


        /////////////
        // Binding //
        /////////////

        /**
         * Add binding to the various element in the accept terms widget
         */
        var addBinding = function(){


            // bind to changed events for the user data flag to record if the use changed the data.
            $acceptterms_gn = $($acceptterms_gn);
            $acceptterms_sn = $($acceptterms_sn);
            changedUserData = "unchanged";
            $acceptterms_gn.unbind("change").bind("change", function() {
                        changedUserData = "updated";
            });
            $acceptterms_sn.unbind("change").bind("change", function() {
                        changedUserData = "updated";
            });

            // Reinitialise the jQuery selector
            $acceptterms_action_accept = $($acceptterms_action_accept.selector);

            // Add binding to the accept button
            $acceptterms_action_accept.unbind("click").bind("click", function () {
                $.ajax({
                     url: "/system/ucam/acceptterms?"+changedUserData,
                     type: "POST",
                     data: {"gn" : $acceptterms_gn.val(),
                            "sn" : $acceptterms_sn.val()},
                     success : function(data) {
                            sakai.api.Util.notification.show($acceptterms_accepted.html(),
                                sakai.api.i18n.Widgets.getValueForKey("acceptterms","","TERMS_ACCEPTED"));
                            if( changedUserData == "updated" ) {
                                location.reload();
                            }
                     },
                     error : function(status) {
                            sakai.api.Util.notification.show($acceptterms_not_accepted.html(),
                                sakai.api.i18n.Widgets.getValueForKey("acceptterms","","ITEMS_NOT_ACCEPTED"));
                     }
                });
                $acceptterms_dialog.jqmHide();
                return false;
            });
        };

        var hasNotAcceptedTerms  = function () {
           if (sakai.data.me.user.anon) {
             return false;
           }
           if ( sakai.data.me.user.properties.hasacceptedterms ) {
              return false;
           }
           return true;
        };

        var myClose=function(hash) { 
           hash.w.fadeOut('2000',function(){ hash.o.remove(); }); 
        }; 


        var loadUserDetails=function() {
                $.ajax({
                     url: "/system/ucam/lookup?x=",
                     type: "GET",
                     success : function(data) {
                            gn = "--??--";
                            if ( data["local"]["firstName"] ) {
                               gn = data["local"]["firstName"];
                            } else if ( data["remote"]["gn"] ) {
                               gn = data["remote"]["gn"];
                            }
                            $acceptterms_gn.val(gn);
                            sn = "--??--";
                            if ( data["local"]["lastName"] ) {
                               sn = data["local"]["lastName"];
                            } else if ( data["remote"]["sn"] ) {
                               sn = data["remote"]["sn"];
                            }
                            $acceptterms_sn.val(sn);
                     },
                     error : function(status) {
                            $acceptterms_gn.val("--??--");
                            $acceptterms_sn.val("--??--");
                     }
                });
        };

        ////////////////////
        // Initialisation //
        ////////////////////

        /**
         * Initialize the accept terms widget
         * All the functionality in here is loaded before the widget is actually rendered
         */
        var init = function(){
            if ( hasNotAcceptedTerms() ) {
               // This will make the widget popup as a layover.

               
               $acceptterms_dialog.jqm({
                  modal: true,
                  toTop: true,
                  onHide : myClose,
                  closeClass: "no-close-class"
               });
               addBinding();
               loadUserDetails();
               $acceptterms_dialog.jqmShow();
            }
        };

        init();
    };

    sakai.api.Widgets.widgetLoader.informOnLoad("acceptterms");
});
