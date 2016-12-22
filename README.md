# Structured Data API

[![Build Status](https://travis-ci.org/glitchdigital/structured-data-api.svg?branch=master)](https://travis-ci.org/glitchdigital/structured-data-api)

This is a simple server to easily create Search, Create, Retrieve, Update and Delete (SCRUD) methods for managing Structured Data entities.

It comes with schemas for People, Places, Organizations, Events and Quotes and is easy to extend just by editing *JSON-schema* files in the `schemas` directory.

API end-points, documentation, database storage, validation are all handled automatically - you just need to edit schemas and restart the sever for changes to take effect (no coding required, just a little configuration).

It provides a simple system to generate API keys, with public read access and API keys being required to make changes (i.e. Creating, Updating and Deleting) and takes care of serving schemas, validation and exporting data as JSON-LD.

The web front end looks like this: https://api.glitch.digital

You are encouraged to fork and adapt this codebase to your own needs!

## Quick start

If you have Node.js and MongoDB already installed all you need to do is download and install it:

    git clone https://github.com/glitchdigital/structured-data-api.git
    cd structured-data-api
    npm install
    npm start
    
That's it! Go to http://localhost:3000 in your browser to get started.

To generate an API key, use the add-user script:

    bin/add-user.js -e john.smith@example.com
    API Key: 360U7-5584S-CSQQL-6TM13-KMSZ6-91637	Email: john.smith@example.com

There are also 'list-users' and 'remove-user' scripts in the ./bin/ directory. Pass '--help' as an argument for options.

### Having trouble?

If you don't have Node.js and MongoDB instaled and are running on a Mac, just install [Homebrew](http://brew.sh) then run this BEFORE running the commands above:

    brew install mongodb node

Alternatively, you can use this button to deploy it remotely to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/glitchdigital/structured-data-api)

This is the easiest way to get started. You'll probably want to configure some options using environment variables if use Heroku. See the section "Deploying to Heroku" for more details.

Note that if you configure your instance via environables (including an admin API key) you will want to restart your Heroku instance to apply changes.

## About this platform

This platform uses Node.js, with the Express and Mongoose libraries to allow for rapid application development and quick prototyping for projects that involve structured data.

If you don't need features like SPARQL support all you need is Node.js and MongoDB installed. If you don't want to install anything locally you can also just deploy it to Heroku (there is a magic button for doing that below).

The focus of this platform is utility and ease of use. It aims to be informed by and compliant with existing relevant standards.

It currently includes example schemas for:

* [Articles](schemas/Article.json)
* [People](schemas/Person.json)
* [Places](schemas/Place.json)
* [Organizations](schemas/Organization.json)
* [Events](schemas/Event.json)
* [Quotations](schemas/Quotation.json)

These are currently simple implementations based on properties defined at schema.org.

Note: This is not a Linked Data Platform and does not aim for compliance with LDP but rather provides a practical way to easily manage entities (and could also be used to populate and manage content in a Triplestore). JSON-schema is used to define objects and for validation and it is able to output them as both plain JSON and JSON-LD.

### Getting started

You'll need Node.js installed and MongoDB running locally to run this software.

Once downloaded, install and run with:

    npm install
    npm start

The server will then be running at `http://example.com`. Please note there is no web based user interface yet, just a RESTful API!

#### Testing

If you want to run the tests you will need `mocha` installed:

    npm install mocha -g

You can check everything is working with `npm test`.

#### Configuration options

Note: See also "Advanced usage" for additional options.

##### MONGODB

If you don't have a MongoDB database running locally, or want to specify a remote server or an alternative database name you can passing a connection string as an environment variable before calling `npm start` or `npm test`.

    MONGODB=mongodb://username:password@server.example.com:27017/db-name npm start
    
##### SITE\_NAME

If you want your site to display your own name instead of "Structured Data API" but don't want to have to edit the templates, you can use the SITE\_NAME environment variable.

    SITE_NAME="Acme Inc." npm start

##### BASE\_URI

You can specify the base uri to use in all absolute URLS (including IDs for entities and the URLs for schemas) using BASE\_URI environment variable. It is strongly recommended you explicitly set this as auto-detection does not always work well when behind a load balancer or proxy (e.g. Heroku).

    BASE_URI="https://yourserver.example.com" npm start

##### CONTEXT\_URI

When requesting JSON-LD resources the default value for @context field is "http://schema.org/" (as that's one of the most common shared definitions) and it assumes your schema is named appropriately (e.g. if you have a schema called "Person" that it follows http://schema.org/Person).

If you are not creating schema that follow schema.org and want to use your own value for @context use the CONTEXT\_URI environment variable.

    CONTEXT_URI="https://yourserver.example.com" npm start

##### ALLOW\_ORIGIN

By default the "Access-Control-Allow-Origin" HTTP header is set to "*" to allow API requests from a browser at any domain. If you want to restrict this to only allow in-browser requests to a specific website you can use the ALLOW\_ORIGIN environment variable.

    ALLOW_ORIGIN="https://www.example.com" npm start

The "Access-Control-Allow-Methods" HTTP header is set automatically.

##### Schemas

You can specify a schema dir other that `schemas` using the SCHEMAS environment variable.

    SCHEMAS=/usr/local/schemas/ npm start
    
For more information about schemas see the "Advanced usage" section.

##### Admin API key

You can create user accounts to control write access, but if you want to you can also set an Admin API Key at runtime using the ADMIN\_API\_KEY environment variable. This can be useful when deploying on services like Heroku.

    ADMIN_API_KEY="TZX1T-LZTWM-7BW82-89XQT-8A4M2-YQU48" npm start

#### Deploying to Heroku

If don't have Node.js and MongoDB set up locally and want to deploy it to Heroku you can use the following link deploy a free instance (it will also setup and connect to a free database with mLab for you too).

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/glitchdigital/structured-data-api)

Note: If you are using Heroku, you'll want to set a value for ADMIN\_API\_KEY you can use to create and edit entries via the API and to set the BASE\_URI to whatever the name of your site is on Heroku:

    BASE_URI="http://myapp.herokuapp.com"

### Modifying schemas

The files in `schemas` are in **JSON-schema** format, which read more about at http://JSON-schema.org

For interoperability with other linked data you might want to refer to the schemas at https://schema.org

**Note:**

* Schemas on schema.org are available in *JSON-LD* format.
* This is not the same as the *JSON-schema* format.

That there are two different schema formats in JSON can be confusing. While designed with different use cases in mind, they are similar in many ways but each has unique features.

For example: *JSON-LD* is used to described Linked Data objects between computer systems (e.g. web sites and search engines) while *JSON-schema* is intended to used by people to describe the schema to the computer and things like validation for properties what error message to display if something is incorrectly formatted.

#### SPARQL and Triplestore support

If you have a dedicated Triplestore you could look for the *save* and *remove* hooks in `lib/schemas.js` to push updates to another data source on every create/update/delete request. Alternatively, some Triplestores like AllegroGraph provide a way to sync them with MongoDB.

For a list of Triplestores, see:  https://en.wikipedia.org/wiki/List_of_subject-predicate-object_databases.

## How to use the REST API

### Authentication

The API supports access control to limit who can make changes.

* Searching and Retrieving do not require an API key to be passed.
* Creating, Updating and Deleting require an API key.

You will need to pass this API key in the 'x-api-key' header in each request, as shown in the examples below.

To get an API Key you can either:

* Run the `add-user` script to create a user account and obtain an API key (see details below).

* Set the ADMIN\_API\_KEY environment variable at run time.

    e.g. `ADMIN_API_KEY="TZX1T-LZTWM-7BW82-89XQT-8A4M2-YQU48" npm start`

    This option is useful if you only have one account that needs write access and you are deploying to somewhere like Heroku and don't want to have to SSH in to create a user.
    
#### Creating a user account

Use the `add-user` command line script to generate an API key:

    bin/add-user.js --name="Jane Smith" --email="jane.smith@example.com"

Both the **email address** and the **API key** values are unique.

i.e. There can be only one user account for an email address and different email address cannot have the same API key.

#### Listing user accounts

Use the `list-users` command line script to list all users:

    bin/list-users.js

#### Removing a user account

Use the `remove-user` command line script to remove a user by ID:

    bin/remove-user.js --id="57372a11371f140a2ad10b07"
    
You can also remove users by specifying their API key:

    bin/remove-user.js --api-key="410f82fae1f22b9a356b3264b2611eaf"
    
…or email address:

    bin/remove-user.js --email="jane.smith@example.com"

#### Customising authentication behaviour 

If you want to modify authentication behaviour you can customise the `checkHasReadAccess` and `checkHasWriteAccess` methods in `routes/api.js`.

### Retrieve available schemas

HTTP GET to /schemas

    curl http://example.com/schemas
    
### Retrieve a schema

HTTP GET to /:schemaName

    curl http://example.com/Person

### Creating

HTTP POST to /:schemaName

    curl -X POST -d '{"name": "John Smith", "description": "Description goes here..."}' -H "Content-Type: application/json" -H "x-api-key: TZX1T-LZTWM-7BW82-89XQT-8A4M2-YQU48" http://example.com/Person

### Retrieving

HTTP GET to /:schemaName/:id

    curl http://example.com/Person/9cb1a2bf7f5e321cf8ef0d15

To request entities as JSON-LD:

    curl -H "Accept: application/ld+json" http://example.com/Person/9cb1a2bf7f5e321cf8ef0d15

### Updating

HTTP PUT to /:schemaName/:id

    curl -X PUT -d '{"name": "Jane Smith", "description": "Updated description..."}' -H "Content-Type: application/json" -H "x-api-key: TZX1T-LZTWM-7BW82-89XQT-8A4M2-YQU48" http://example.com/Person/9cb1a2bf7f5e321cf8ef0d15

### Deleting

HTTP DELETE to /:schemaName/:id

    curl -X DELETE -H "x-api-key: TZX1T-LZTWM-7BW82-89XQT-8A4M2-YQU48" http://example.com/Person/9cb1a2bf7f5e321cf8ef0d15

### Searching

You can search against values in the 'name' and 'description' fields and specify one or both options as query paramaters.

You can also use 'q' to search both - in future this option may also support searching across other fields.

HTTP GET to /:schemaName/search

    curl http://example.com/Person/search?q=John+Smith

To request entities as JSON-LD:

    curl -H "Accept: application/ld+json" http://example.com/Person/search?name=John+Smith

## Advanced usage

### Schemas

If a schema is in a sub-directory, the MongoDB name of the collection it will be stored in will be a pluralized form of the schema's parent directory.

If a schema is in the root of the schema directory, then it will be stored in the default collection (the default collection name is "entities"; it can be changed using the DEFAULT_COLLECTION environment variable).

e.g.

    schemas/Person.json                             collection: 'entities'
    schemas/Organization.json                       collection: 'entities'
    schemas/Person/Person.json                      collection: 'people'
    schemas/Person/Author.json                      collection: 'people'
    schemas/CreativeWork/Article.json:              collection: 'creativeWorks'
    schemas/CreativeWork/Report.json:               collection: 'creativeWorks'
    schemas/CreativeWork/Article/NewsArticle.json:  collection: 'articles'
 
 
Note: It will attempt to pluralize English words according to normal grammatical rules.

    e.g.  "book"    -> "books"
          "person"  -> "people"
          "sheep"   -> "sheep"
  
If you want to be able to search across all your entries in the DB with a single query then you might want to have them all in the same collection (i.e. and not place them in sub-directories).

If you you want to be strict about keeping different entities types in different collections you can place them in sub directories accordingly.

This is a decision you should make carefully before you publish your API as you want to change it later you'd have to migrate items in the database (this application won't do that for you!). If you are not sure it's fine to keep everything in the same collection.

Be sure to update the paths for any local references so they are relative to schema they are in (e.g. '$ref': 'Place.json' -> '$ref': '../Place.json');
    
### ObjectID format support

Properties can be defined as referring to ObjectId's. This is not part of the JSON-schema standard, but extends it.

    "myProperty": { "type": "string", "format": "objectid" }

Properties defined like this will treated like actual ObjectIDs internally (and not just stored as strings).

The exception is that that if used with "mixed type" property (i.e. in conjunction with "oneOf" or "anyOf" in a schema) it will still be validated correctly however will be (incorrectly) stored in the database as a string and not an ObjectID.

For example, in this case either an object matching the "Person" schema or a string that is formated as an ObjectID is valid but in the case of an ObjectID it will be stored as string internally.

    "myProperty": {
      "oneOf": [ 
         {  "type": "string", "format": "objectid" },
         {  $ref: "Person.json }
      ]
    }

If you want to reference external entities, you might want to also consider using URIs:

    "myProperty": {
      "oneOf": [ 
         {  "type": "string", "format": "uri" },
         {  $ref: "Person.json }
      ]
    }

### Referencing other entities in a schema

You can safely reference other schema files in your schemas.

By filename:

    "birthPlace": {
      "$ref": "Place.json"
    }

By URI:

    "birthPlace": {
      "$ref": "http://example.com/place.json"
    }

By fragment:

    "birthPlace": {
      "$ref": "Place.json#/definitions/PostalAddress"
    }

* If any *remote* schemas are unavailable at startup your server will not start (!). To avoid this you may wish to consider referencing only local copies.

* If any of your schemas contain circular references (e.g. Schema\_A references Schema\_B -> Schema\_B references Schema\_C -> Schema\_C references Schema\_A) then this will impact validation. See "Circular references" below for more information.

### Customing reference handling

Instead of automatically serializing references by including referenced schemas you can set the environment variable REPLACE\_REF to change the default behaviour.

You can use it o replace $ref values in schemas with other types - either an "object", a "uri" or a database "objectid".

For example if your schema contains a $ref value (either locally or remote):

    "birthPlace": {
      "$ref": "http://example.com/place.json"
    }

Then the default behaviour is to include the referenced schema, resulting in:

    birthPlace: {
      $schema: "http://json-schema.org/schema#",
      title: "Place Schema",
      type: "object",
      properties: {
        // List of properties
      }
    }

Using `REPLACE_REF="uri" npm start` would do this:

    birthPlace: {
      type: "string",
      format: "uri",
      description: "The URL of a resource matching the schema http://example.com/place.json"
    }

Using `REPLACE_REF="object" npm start` would do this:

    birthPlace: {
      type: "object",
      properties: { },
      additionalProperties: true,
      description: "An object matching the schema http://example.com/place.json"
    }


Using `REPLACE_REF="objectid" npm start` would do this:

    birthPlace: {
      type: "string",
      format: "objectid",
      pattern: "^[0-9a-fA-F]{24}$",
      description: "The ObjectID of an object in the database matching the schema http://example.com/place.json"
    }

Note that setting REPLACE\_REF impacts ALL references in ALL schemas (except circular references - see the section "Circular references" below).

### Circular references

The the validator can't currently handle schemas with circular references.

The default behaviour when it detects circular references in a schema is to treat the properties that reference other schemas in that schema to plain objects and to skip validation of those properties (i.e. allow any object).

You can use the REPLACE\_CIRCULAR\_REF environment variable just like REPLACE\_REF but to impact only schemas with circular references - so you can have schemas with circular references instead require URIs or ObjectIDs for entities they reference, instead of plain objects.

### Data migration

You can add and remove properties from your schema at any time - you just need to restart the server for the changes to take effect.

If you want to edit an existing property (e.g. to rename 'surname' to 'lastName') them you'll need to also update the collection in the database manually.

Example of a MongoDB command to rename a property in all records in the 'entities' collection:

    db.entities.update({}, {$rename:{"surname":"lastName"}}, false, true);
    
### Backup / restore

You can use the standard `mongodump` and `mongorestore` commands for backups.

#### Backup

    mongodump --db structured-data 

#### Restore from backup

    mongorestore --db structured-data dump/structured-data 

## Contributing

Contributions in the form of pull requests with bug fixes, enhancements and tests - as well as bug reports and feature requests - are all welcome.
