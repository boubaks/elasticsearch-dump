# elasticsearch-dump
export and import (dump) from an elasticsearch to an another

## Installation

$> npm install -g elasticsearch-dump

$> elasticsearch-dump

## Launch elasticsearch-dump

	$> elasticsearch-dump --help
	Usage: node elasticsearch-dump

	  -i, --indexFrom=ARG  index to export (default to all)
	  -t, --typeFrom=ARG   type to export
	  -P, --portFrom=ARG   port to connect to
	  -H, --hostFrom=ARG   server to connect to
	      --indexTo=ARG    index to export (default to all)
	      --typeTo=ARG     type to export
	      --portTo=ARG     port to connect to
	      --hostTo=ARG     server to connect to
	  -q, --query=ARG      export by a query
	  -e, --elsQuery=ARG   export by a elasticsearch query
	  -h, --help           display this help
	  -v, --version        show version



## How to use the elasticsearch-dump
    
    $> elasticsearch-dump --hostFrom localhost --portFrom 9200
    --indexFrom indexfrom --typeFrom --typefrom --hostTo 193.22.341.2
    --portTo 9300 --indexTo indexto --typeTo typeto

    This command will dump all document from localhost:9200/indexfrom/typefrom
    to 193.22.341.2:9300/indexto/typeto
  
## Notes

For import data to elasticsearch you can use the elasticsearch-import tool.
For export data from elasticsearch you can use the elasticsearch-export tool.

More information on :
https://github.com/boubaks/elasticsearch-import
https://github.com/boubaks/elasticsearch-export