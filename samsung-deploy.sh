#!/bin/bash

echo "Samsung Smart Classroom"

if [ ! -d /var/www/smartclassroom.mstd.ro ]; then
    git clone git@git.qbyco.com:samsung/smartclassroom.git /var/www/smartclassroom.mstd.ro
    
else

    git --git-dir=/var/www/qbyco.landing.page/.git --work-tree=/var/www/qbyco.landing.page checkout master
    git --git-dir=/var/www/qbyco.landing.page/.git --work-tree=/var/www/qbyco.landing.page fetch origin
    git --git-dir=/var/www/qbyco.landing.page/.git --work-tree=/var/www/qbyco.landing.page rebase origin/master

    git --git-dir=/var/www/qbyco.landing.page/.git --work-tree=/var/www/qbyco.landing.page log --oneline --graph --color

fi