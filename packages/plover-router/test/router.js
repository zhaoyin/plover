'use strict';


const router = require('../lib/router');


describe('plover-router/lib/router', () => {
  it('http verb route', () => {
    const config = (r) => {
      r.get('/', 'home#index');
      r.get('/profile', 'users#edit');
      r.post('/loginout', 'session#delete');

      r.put('/photos/:id', 'photos#update');
      r.patch('/photos/:id', 'photos#update');
      r.delete('/photos/:id', 'photos#delete');
    };

    const routes = router(config).routes;
    routes.should.eql([
      { match: '/', to: 'home#index', verb: 'get' },
      { match: '/profile', to: 'users#edit', verb: 'get' },
      { match: '/loginout', to: 'session#delete', verb: 'post' },
      { match: '/photos/:id', to: 'photos#update', verb: 'put' },
      { match: '/photos/:id', to: 'photos#update', verb: 'patch' },
      { match: '/photos/:id', to: 'photos#delete', verb: 'delete' }
    ]);
  });


  it('resources route', () => {
    const config = (r) => {
      r.resources('photos');
    };

    const routes = router(config).routes;
    routes.should.eql([
      {
        match: '/photos',
        to: { module: 'photos', action: 'index' },
        verb: 'get'
      },
      {
        match: '/photos/new',
        to: { module: 'photos', action: 'new' },
        verb: 'get'
      },
      {
        match: '/photos',
        to: { module: 'photos', action: 'create' },
        verb: 'post'
      },
      {
        match: '/photos/:id',
        to: { module: 'photos', action: 'show' },
        verb: 'get'
      },
      {
        match: '/photos/:id/edit',
        to: { module: 'photos', action: 'edit' },
        verb: 'get'
      },
      {
        match: '/photos/:id',
        to: { module: 'photos', action: 'update' },
        verb: 'put'
      },
      {
        match: '/photos/:id',
        to: { module: 'photos', action: 'update' },
        verb: 'patch'
      },
      {
        match: '/photos/:id',
        to: { module: 'photos', action: 'delete' },
        verb: 'delete'
      }
    ]);
  });


  it('resouces route with selected actions', () => {
    const config = (r) => {
      r.resources('revisions', { only: ['index', 'show', 'update'] });
    };

    const routes = router(config).routes;
    routes.should.eql([
      {
        match: '/revisions',
        to: { module: 'revisions', action: 'index' },
        verb: 'get'
      },
      {
        match: '/revisions/:id',
        to: { module: 'revisions', action: 'show' },
        verb: 'get'
      },
      {
        match: '/revisions/:id',
        to: { module: 'revisions', action: 'update' },
        verb: 'put'
      },
      {
        match: '/revisions/:id',
        to: { module: 'revisions', action: 'update' },
        verb: 'patch'
      }
    ]);
  });


  it('with namespace', () => {
    const config = (r) => {
      r.namespace('/admin', () => {
        r.get('/users/:id', 'users#show');
        r.resources('photos', { only: ['index', 'show'] });
      });
    };

    const routes = router(config).routes;
    routes.should.eql([
      {
        match: '/admin/users/:id',
        to: 'users#show',
        verb: 'get'
      },
      {
        match: '/admin/photos',
        to: { module: 'photos', action: 'index' },
        verb: 'get'
      },
      {
        match: '/admin/photos/:id',
        to: { module: 'photos', action: 'show' },
        verb: 'get'
      }
    ]);
  });


  it('nested resources', () => {
    const config = (r) => {
      r.resources('pages', { only: ['index', 'show', 'delete'] }, () => {
        r.resources('revisions', { only: ['index', 'delete'] });
      });
    };

    const routes = router(config).routes;
    routes.should.eql([
      {
        match: '/pages',
        to: { module: 'pages', action: 'index' },
        verb: 'get'
      },
      {
        match: '/pages/:id',
        to: { module: 'pages', action: 'show' },
        verb: 'get'
      },
      {
        match: '/pages/:id',
        to: { module: 'pages', action: 'delete' },
        verb: 'delete'
      },
      {
        match: '/pages/:page_id/revisions',
        to: { module: 'revisions', action: 'index' },
        verb: 'get'
      },
      {
        match: '/pages/:page_id/revisions/:id',
        to: { module: 'revisions', action: 'delete' },
        verb: 'delete'
      }
    ]);
  });


  it('nested resources more', () => {
    const config = (r) => {
      const resources = r.resources;
      resources('publishers', () => {
        resources('magazines', () => {
          resources('photos');
        });
      });
    };

    const routes = router(config).routes;
    routes.length.should.equal(24);
    routes[23].should.eql({
      match: '/publishers/:publisher_id/magazines/:magazine_id/photos/:id',
      to: { module: 'photos', action: 'delete' },
      verb: 'delete'
    });
  });


  it('use middleware', () => {
    const mw = function() {};

    const config = (r) => {
      r.use('/photos/*', mw);
      r.use('/', mw);
      r.use(mw);

      r.namespace('/admin', () => {
        r.use('/users/*', mw);
        r.use('/', mw);
        r.use(mw);
      });
    };


    const mws = router(config).middlewares;
    mws.should.eql([
      { match: '/photos/*', middleware: mw, options: {} },
      { match: '/', middleware: mw, options: {} },
      { match: undefined, middleware: mw, options: {} },
      { match: '/admin/users/*', middleware: mw, options: {} },
      { match: '/admin/', middleware: mw, options: {} },
      { match: '/admin', middleware: mw, options: {} }
    ]);
  });
});
