/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     2016/8/23 上午 11:10:44                        */
/*==============================================================*/


drop table if exists AuthApp;

drop table if exists CApp;

drop table if exists ExeRole;

drop table if exists ExtSecret;

drop table if exists ExtService;

drop table if exists GrpUser;

drop table if exists OpAccess;

drop table if exists Person;

drop table if exists Resource;

drop table if exists RsOp;

drop table if exists RsProp;

drop table if exists UGroup;

drop table if exists UserFavi;

drop table if exists UserToken;

/*==============================================================*/
/* Table: AuthApp                                               */
/*==============================================================*/
create table AuthApp
(
   CApp_id              bigint not null,
   UseCApp_id           bigint not null,
   readable             bool,
   writable             bool,
   maxRole              smallint,
   primary key (UseCApp_id, CApp_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: CApp                                                  */
/*==============================================================*/
create table CApp
(
   CApp_id              bigint not null auto_increment,
   lcaID                bigint not null,
   UGroup_id            bigint not null,
   caCode               varchar(32),
   title                varchar(64),
   descTx               varchar(512),
   extURL               varchar(256),
   appKey               varchar(32),
   appSecret            varchar(64),
   accScheme            smallint,
   actScheme            smallint,
   isPublic             bool,
   isExt                bool,
   primary key (CApp_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: ExeRole                                               */
/*==============================================================*/
create table ExeRole
(
   ExeRole_id           bigint not null auto_increment,
   rcode                varchar(8),
   name                 varchar(32),
   descTx               varchar(256),
   score                smallint,
   primary key (ExeRole_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: ExtSecret                                             */
/*==============================================================*/
create table ExtSecret
(
   esID                 bigint not null auto_increment,
   caID                 bigint not null,
   accName              varchar(64) not null,
   secret               varchar(32),
   primary key (esID)
)
engine = InnoDB;

/*==============================================================*/
/* Index: IDX_ExtSec_NPK                                        */
/*==============================================================*/
create unique index IDX_ExtSec_NPK on ExtSecret
(
   caID,
   accName
);

/*==============================================================*/
/* Table: ExtService                                            */
/*==============================================================*/
create table ExtService
(
   ExtService_id        bigint not null auto_increment,
   url                  varchar(256),
   method               smallint,
   headers              text,
   primary key (ExtService_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: GrpUser                                               */
/*==============================================================*/
create table GrpUser
(
   GrpUser_id           bigint not null auto_increment,
   UGroup_id            bigint not null,
   ExeRole_id           bigint not null,
   Person_id            bigint not null,
   accName              varchar(64),
   passwd               varchar(64),
   dspName              varchar(32),
   iconURI              varchar(256),
   actID                varchar(64),
   extID                varchar(64),
   _c_json              text,
   createTime           datetime,
   isTemp               bool,
   isValid              bool,
   primary key (GrpUser_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: OpAccess                                              */
/*==============================================================*/
create table OpAccess
(
   ExeRole_id           bigint not null,
   RsOp_id              bigint not null,
   ok                   bool,
   primary key (ExeRole_id, RsOp_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: Person                                                */
/*==============================================================*/
create table Person
(
   Person_id            bigint not null auto_increment,
   geID                 bigint,
   fname                varchar(64),
   lname                varchar(32),
   nid                  varchar(16),
   dob                  date,
   gender               tinyint,
   email                varchar(256),
   mobile               varchar(16),
   isNature             bool,
   primary key (Person_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: Resource                                              */
/*==============================================================*/
create table Resource
(
   Resource_id          bigint not null auto_increment,
   UGroup_id            bigint not null,
   CApp_id              bigint not null,
   Res_Resource_id      bigint,
   rsCode               varchar(32),
   tbName               varchar(64),
   isPublic             bool,
   dftMode              smallint,
   nextID               bigint,
   primary key (Resource_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: RsOp                                                  */
/*==============================================================*/
create table RsOp
(
   RsOp_id              bigint not null auto_increment,
   Resource_id          bigint not null,
   ExtService_id        bigint,
   opCode               varchar(32),
   jsonfp               text,
   isPrim               bool,
   isFinal              bool,
   primary key (RsOp_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: RsProp                                                */
/*==============================================================*/
create table RsProp
(
   RsProp_id            bigint not null auto_increment,
   Resource_id          bigint not null,
   cname                varchar(32),
   mode                 smallint,
   removed              bool,
   primary key (RsProp_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: UGroup                                                */
/*==============================================================*/
create table UGroup
(
   UGroup_id            bigint not null auto_increment,
   CApp_id              bigint,
   grpCode              varchar(32),
   primary key (UGroup_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: UserFavi                                              */
/*==============================================================*/
create table UserFavi
(
   ufvID                bigint not null auto_increment,
   pufvID               bigint,
   CApp_id              bigint not null,
   GrpUser_id           bigint not null,
   title                varchar(32),
   descTx               varchar(256),
   primary key (ufvID)
)
engine = InnoDB;

/*==============================================================*/
/* Table: UserToken                                             */
/*==============================================================*/
create table UserToken
(
   UserToken_id         bigint not null auto_increment,
   GrpUser_id           bigint not null,
   caID                 bigint,
   token                varchar(64),
   tknExpire            bigint,
   devID                varchar(64),
   isVapor              bool,
   primary key (UserToken_id)
)
engine = InnoDB;

/*==============================================================*/
/* Table: Locales                                               */
/*==============================================================*/
create table Locales
(
   lcaID                bigint not null auto_increment,
   lngCode              varchar(16),
   primary key (lcaID)
)
engine = InnoDB;

alter table AuthApp add constraint FK_AuthApp foreign key (CApp_id)
      references CApp (CApp_id) on delete restrict on update restrict;

alter table AuthApp add constraint FK_AuthApp_use foreign key (UseCApp_id)
      references CApp (CApp_id) on delete restrict on update restrict;

alter table CApp add constraint FK_caRgrp foreign key (UGroup_id)
      references UGroup (UGroup_id) on delete restrict on update restrict;

alter table CApp add constraint FK_caRlc foreign key (lcaID)
      references Locales (lcaID) on delete restrict on update restrict;

alter table ExtSecret add constraint FK_esRca foreign key (caID)
      references CApp (CApp_id) on delete restrict on update restrict;

alter table GrpUser add constraint FK_guRgrp foreign key (UGroup_id)
      references UGroup (UGroup_id) on delete restrict on update restrict;

alter table GrpUser add constraint FK_wuRer foreign key (ExeRole_id)
      references ExeRole (ExeRole_id) on delete restrict on update restrict;

alter table GrpUser add constraint FK_wuRpsn foreign key (Person_id)
      references Person (Person_id) on delete restrict on update restrict;

alter table OpAccess add constraint FK_opaRer foreign key (ExeRole_id)
      references ExeRole (ExeRole_id) on delete restrict on update restrict;

alter table OpAccess add constraint FK_opaRop foreign key (RsOp_id)
      references RsOp (RsOp_id) on delete restrict on update restrict;

alter table Resource add constraint FK_rsRca foreign key (CApp_id)
      references CApp (CApp_id) on delete restrict on update restrict;

alter table Resource add constraint FK_rsRgrp foreign key (UGroup_id)
      references UGroup (UGroup_id) on delete restrict on update restrict;

alter table Resource add constraint FK_rsRrs foreign key (Res_Resource_id)
      references Resource (Resource_id) on delete restrict on update restrict;

alter table RsOp add constraint FK_opRes foreign key (ExtService_id)
      references ExtService (ExtService_id) on delete restrict on update restrict;

alter table RsOp add constraint FK_opRrs foreign key (Resource_id)
      references Resource (Resource_id) on delete restrict on update restrict;

alter table RsProp add constraint FK_rspRrs foreign key (Resource_id)
      references Resource (Resource_id) on delete restrict on update restrict;

alter table UGroup add constraint FK_grpRca foreign key (CApp_id)
      references CApp (CApp_id) on delete restrict on update restrict;

alter table UserFavi add constraint FK_ufRuf foreign key (pufvID)
      references UserFavi (ufvID) on delete restrict on update restrict;

alter table UserFavi add constraint FK_ufvRca foreign key (CApp_id)
      references CApp (CApp_id) on delete restrict on update restrict;

alter table UserFavi add constraint FK_ufvRusr foreign key (GrpUser_id)
      references GrpUser (GrpUser_id) on delete restrict on update restrict;

alter table UserToken add constraint FK_tknRgu foreign key (GrpUser_id)
      references GrpUser (GrpUser_id) on delete restrict on update restrict;

alter table UserToken add constraint FK_utRapp foreign key (caID)
      references CApp (CApp_id) on delete restrict on update restrict;
