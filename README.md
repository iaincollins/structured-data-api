# Structured Data API

This is a simple platform to easily create Search, Create, Retrieve, Update and Delete (SCRUD) methods for managing Structured Data entities.

It comes with schemas for People, Places, Organizations, Events and Quotes and is easy to extend just by editing *JSON-schema* files in the `./schemas/` directory.

## About this platform

This platform uses Node.js, with the Express and Mongoose libraries to allow for rapid application development and quick prototyping for projects that involve structured data.

If you don't need features like SPARQL support all you need is Node.js and MongoDB installed. If you don't want to install anything locally you can also just deploy it to Heroku (there is a magic button for doing that below).

The focus of this platform is utility and ease of use. It aims to be informed by and compliant with existing relevant standards.

It currently includes example schemas for:

* [People](schemas/Person.json)
* [Places](schemas/Place.json)
* [Organizations](schemas/Organization.json)
* [Events](schemas/Event.json)
* [Quotations](schemas/Quotation.json)

These are currently simple implementations based on properties defined at schema.org.

Note: This is not a Linked Data Platform and does not aim for compliance with LDP but rather provides a practical way to easily manage entities (and could also be used to populate and manage content in a Triplestore). JSON-schema is used to define objects and for validation. Support for exporting objects in JSON-LD is still in development, so you'd need to add hooks to transform the objects yourself if you wanted to do that.

### Getting started

You'll need Node.js installed and MongoDB running locally to run this software.

Once downloaded, install and run with:

    npm install
    npm start

The server willl then be running at `http://localhost:3000`. Please note there is no web based user inteface yet, just a RESTful API!

#### Testing

If you want to run the tests you will need `mocha` installed:

    npm install mocha -g

You can check everything is working with `npm test`.

#### Configuration options

##### Database 

If you don't have a MongoDB database running locally or just want to specify a remote server you can passing a connection string as an environment variable before calling `npm start` or `npm test`.

    MONGODB=mongodb://username:password@server.example.com:27017/db-name npm start

By default all objects are stored in a MongoDB Collection named "*entities*". You can specify a different Collection name using the COLLECTION environment variable.
   
    COLLECTION="things" npm start
   
Note: Currently there is no option to change either the REST API routes or to store different schema objects in different Collections. Additional flexibility may appear in a future release.

##### Schemas

You can specify a schema dir other that `./schemas` using the SCHEMAS environment variable.

    SCHEMAS=/usr/local/schemas/ npm start
      
#### Deploy to Heroku

If don't have Node.js and MongoDB set up locally and want to deploy it to Heroku you can use the following link deploy a free instance (it will also setup and connect to a free database with mLab for you too).

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/glitchdigital/structured-data-api)

### Modifying schemas

The files in `./schemas/` must be in the **JSON-schema** format:
http://JSON-schema.org

For interoperability with other linked data you might want to follow the schemas at **schema.org**:
https://schema.org

**Note:**

* Schemas on schema.org are available in *JSON-LD* format.
* This is not the same as the *JSON-schema* format.

That there are two different schema formats in JSON can be confusing. While designed with different use cases in mind, they are similar in many ways but each has unique features.

For example: *JSON-LD* is used to described Linked Data objects between computer systems (e.g. web sites and search engines) while *JSON-schema* is intended to used by people to describe the schema to the computer and things like validation for properties what error message to display if something is incorrectly formatted.

Note: Something that converts *JSON-LD* files to *JSON-schema* files would be helpful here, as it would make it easy to import JSON-LD schemas from sites like schema.org in bulk.

#### Referencing other entities in a schema

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

#### SPARQL and Triplestore support

If you have a dedicated Triplestore you could look for the *save* and *remove* hooks in `./lib/schemas.js` to push updates to another data source on every create/update/delete request. Alternatively, some Triplestores like AllegroGraph provide a way to sync them with MongoDB.

For a list of Triplestores, see:  https://en.wikipedia.org/wiki/List_of_subject-predicate-object_databases.

## How to use the REST API

For working examples see the `test` directory.

### Searching

HTTP GET to /entity/search

    curl http://localhost:3000/entity/search/?name=John+Smith
    curl http://localhost:3000/entity/search/?type=Person

To request entities as JSON-LD (still in development):

    curl -H "Accept: application/ld+json" http://localhost:3000/entity/search/?type=Person

### Creating

HTTP POST to /entity

    curl -X POST -d '{"type": "Person", "name": "John Smith", "description": "Description goes here..."}' -H "Content-Type: application/json" http://localhost:3000/entity

### Retrieving

HTTP GET to /entity/:id

    curl http://localhost:3000/entity/9cb1a2bf7f5e321cf8ef0d15

To request entities as JSON-LD (still in development):

    curl -H "Accept: application/ld+json" http://localhost:3000/entity/9cb1a2bf7f5e321cf8ef0d15

### Updating

HTTP PUT to /entity/:id

    curl -X PUT -d '{"type": "Person", "name": "Jane Smith", "description": "Updated description..."}' -H "Content-Type: application/json" http://localhost:3000/entity/9cb1a2bf7f5e321cf8ef0d15

### Delete

HTTP DELETE to /entity/:id

    curl -X DELETE http://localhost:3000/entity/9cb1a2bf7f5e321cf8ef0d15

## Roadmap

The following features are on the immediate roadmap:

* Provide a login and auth system to limit Creating, Updating and Deleting entires to authorized users.
* A web based interface with to manage entities, users, and documentation.
* Add more powerful searching (e.g. free text, based on properties other than name, type and ID, etc).
* Add option to configure collections and API paths.
* Add JSON-LD support (in development).

## Contributing

Contributions in the form of pull requests with bug fixes, enhancements and tests - as well as bug reports and feature requests - are all welcome.