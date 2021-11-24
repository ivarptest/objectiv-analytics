#Generating docs

Basically, generating and publishing the api docs for `bach` involve a few steps:
1. Configure environment for Sphinx: setup Python environment:
```bash
  virtualenv -p python3 venv
  . venv/bin/activate
  # install sphinx requirements
  pip install -r requirements.txt
  # install bach dependencies
  pip install -r ../requirements.txt
  # install bach in edit mode
  pip install -e ../../bach
  # install objectiv_bach in edit mode
  pip install -e ../../analysis/bach_open_taxonomy
```

2. Generate HTML fragments:
```bash
  make html
```
3. Push generated docs to docusaurus:
   1. Make sure to have a checkout of objectiv/objectiv.io
   2. Run:
```bash
   python generate.py
```

This process will generate and push the html files to docusaurus. How to run / publish the website is detailed in the 
respective readme 
