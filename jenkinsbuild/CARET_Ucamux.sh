#!/bin/bash

# Version configuration, this should match the appropriate value in:
# https://docs.google.com/a/caret.cam.ac.uk/spreadsheet/ccc?key=0AmhGGpAWvnFCdHEzRThtZ0ttZXR4V2NiWkRETXUwcWc&authkey=CJ-m3b8L&hl=en_GB&authkey=CJ-m3b8L
VERSION=`git describe`;

BUILD_STEP=${1};

if [ "${BUILD_STEP}" = "pre" ] ; then
    echo "INFO: Running pre flight check for version: ${VERSION}";
    CHECK_VERSION=`grep ${VERSION} pom.xml`;
    if [ "${?}" != "0" ] ; then
        echo "ERROR: Version \"${VERSION}\" not found in pom.xml, aborting!"
        exit 1;
    fi
else
    if [ "${BUILD_STEP}" = "post" ] ; then
        echo "INFO: Running post build setup for version: ${VERSION}";
        NAME="uk/ac/cam/caret/oae/uk.ac.cam.caret.oae.ucam-ux"
        URL="maven2.caret.cam.ac.uk"
        echo "INFO: Making directory /var/www/${URL}/htdocs/${NAME}/${VERSION} on ${URL}";
        ssh ${URL} "mkdir -p /var/www/${URL}/htdocs/${NAME}/${VERSION}";
        echo "INFO: Synching ~/.m2/repository/${NAME}/${VERSION} to ${URL}:/var/www/${URL}/htdocs/${NAME}/";
        rsync -av --delete ~/.m2/repository/${NAME}/${VERSION} ${URL}:/var/www/${URL}/htdocs/${NAME}/
    else
        echo "ERROR: Invalid build step: \"${BUILD_STEP}\" specified";
        echo "ERROR: Please use ${0} (pre|post)";
        exit 2;
    fi
fi

exit 0;
