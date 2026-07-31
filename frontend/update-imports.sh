#!/bin/bash
# Script to update react-router-dom imports to react-router

find src -name "*.tsx" -type f -exec sed -i "s/from 'react-router-dom'/from 'react-router'/g" {} +
find src -name "*.tsx" -type f -exec sed -i 's/from "react-router-dom"/from "react-router"/g' {} +

echo "Updated all react-router-dom imports to react-router"
