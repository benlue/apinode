INSERT INTO ExeRole(ExeRole_id, rcode, score) VALUES
(1, 'root', 1000),
(2, 'dsn', 600),
(3, 'mgn', 400),
(4, 'opr', 200),
(5, 'vip', 150),
(6, 'mbr', 110),
(7, 'gst', 0);

INSERT INTO UGroup (UGroup_id, grpCode) VALUES
(1, 'designGroup'),
(10, 'coreAppGroup');

INSERT INTO CApp(CApp_id, lcaID, UGroup_id, caCode, appKey, appSecret, isPublic, isExt) VALUES
(10, 58, 10, 'admin', '2a03f4a9a5b447349ad974326d34ea22', '5678', true, false),
(11, 58, 10, 'api', '563420cab70f4316b7dada8d1158eda8', '5678', true, false);


INSERT INTO Resource(Resource_id, CApp_id, UGroup_id, rsCode, dftMode, isPublic) VALUES
(200, 10, 10, 'app', 62, true),
(201, 10, 10, 'resource', 62, true),
(202, 10, 10, 'operator', 62, true),
(204, 10, 10, 'opAccess', 62, true),
(205, 10, 10, 'person', 62, true),
(206, 10, 10, 'group', 62, true),
(207, 10, 10, 'user', 62, true),
(208, 10, 10, 'token', 62, true),
(209, 10, 10, 'log', 62, true);

/* admin/app */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1100, 200, 'create', true, null),
(1101, 200, 'delete', true, null),
(1102, 200, 'save', true, null),
(1103, 200, 'query', true, null),
(1104, 200, 'list', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(2, 1100, true),
(5, 1100, true),
(6, 1100, true),
(2, 1101, true),
(5, 1101, true),
(6, 1101, true),
(2, 1102, true),
(5, 1102, true),
(6, 1102, true),
(2, 1103, true),
(5, 1103, true),
(6, 1103, true),
(2, 1104, true),
(5, 1104, true),
(6, 1104, true);

/* admin/resource */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1106, 201, 'create', true, null),
(1107, 201, 'delete', true, null),
(1108, 201, 'save', true, null),
(1109, 201, 'query', true, null),
(1110, 201, 'list', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(2, 1106, true),
(3, 1106, true),
(4, 1106, true),
(5, 1106, true),
(6, 1106, true),
(2, 1107, true),
(3, 1107, true),
(4, 1107, true),
(5, 1107, true),
(6, 1107, true),
(2, 1108, true),
(3, 1108, true),
(4, 1108, true),
(5, 1108, true),
(6, 1108, true),
(2, 1109, true),
(3, 1109, true),
(4, 1109, true),
(5, 1109, true),
(6, 1109, true),
(2, 1110, true),
(3, 1110, true),
(4, 1110, true),
(5, 1110, true),
(6, 1110, true);

/* admin/operator */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1112, 202, 'create', true, null),
(1113, 202, 'delete', true, null),
(1114, 202, 'save', true, null),
(1115, 202, 'query', true, null),
(1116, 202, 'list', true, null),
(1117, 202, 'setAccess', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(2, 1112, true),
(3, 1112, true),
(4, 1112, true),
(5, 1112, true),
(6, 1112, true),
(5, 1113, true),
(6, 1113, true),
(2, 1114, true),
(3, 1114, true),
(4, 1114, true),
(5, 1114, true),
(6, 1114, true),
(2, 1115, true),
(3, 1115, true),
(4, 1115, true),
(5, 1115, true),
(6, 1115, true),
(2, 1116, true),
(3, 1116, true),
(4, 1116, true),
(5, 1116, true),
(6, 1116, true),
(2, 1117, true),
(3, 1117, true),
(4, 1117, true),
(5, 1117, true),
(6, 1117, true);

/* admin/opAccess */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1126, 204, 'create', true, null),
(1127, 204, 'delete', true, null),
(1128, 204, 'save', true, null),
(1129, 204, 'query', true, null),
(1130, 204, 'list', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(5, 1126, true),
(5, 1127, true),
(5, 1128, true),
(5, 1129, true),
(5, 1130, true);

/* admin/person */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1133, 205, 'create', true, null),
(1134, 205, 'delete', true, null),
(1135, 205, 'save', true, null),
(1136, 205, 'query', true, null),
(1137, 205, 'list', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(5, 1133, true),
(5, 1134, true),
(5, 1135, true),
(5, 1136, true),
(5, 1137, true);

/* admin/group */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1140, 206, 'create', true, null),
(1141, 206, 'delete', true, null),
(1142, 206, 'save', true, null),
(1143, 206, 'query', true, null),
(1144, 206, 'list', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(5, 1140, true),
(5, 1141, true),
(5, 1142, true),
(5, 1143, true),
(5, 1144, true);

/* admin/user */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1148, 207, 'create', true, null),
(1149, 207, 'delete', true, null),
(1150, 207, 'update', true, null),
(1151, 207, 'view', true, null),
(1152, 207, 'list', true, null),
(1153, 207, 'profile', true, null),
(1154, 207, 'login', true, null),
(1155, 207, 'accNameOk', true, null),
(1156, 207, 'activate', true, null),
(1157, 207, 'logout', true, null),
(1158, 207, 'updateRole', true, null),
(1159, 207, 'updatePasswd', true, null),
(1160, 207, 'register', true, null),
(1161, 207, 'resetPasswd', true, null),
(1162, 207, 'icon', true, null),
(1163, 207, 'setIcon', true, null),
(1164, 207, 'switchUser', true, null),
(1166, 207, 'createTemp', true, null),
(1167, 207, 'convertTemp', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(5, 1148, true),
(6, 1148, true),
(7, 1148, true),
(2, 1149, true),
(3, 1149, true),
(2, 1150, true),
(3, 1150, true),
(4, 1150, true),
(5, 1150, true),
(6, 1150, true),
(2, 1151, true),
(3, 1151, true),
(4, 1151, true),
(5, 1151, true),
(6, 1151, true),
(5, 1152, true),
(6, 1152, true),
(2, 1153, true),
(3, 1153, true),
(4, 1153, true),
(5, 1153, true),
(6, 1153, true),
(7, 1153, true),
(2, 1154, true),
(3, 1154, true),
(4, 1154, true),
(5, 1154, true),
(6, 1154, true),
(7, 1154, true),
(2, 1155, true),
(3, 1155, true),
(4, 1155, true),
(5, 1155, true),
(6, 1155, true),
(7, 1155, true),
(2, 1157, true),
(3, 1157, true),
(4, 1157, true),
(5, 1157, true),
(6, 1157, true),
(2, 1158, true),
(3, 1158, true),
(4, 1158, true),
(2, 1159, true),
(3, 1159, true),
(4, 1159, true),
(5, 1159, true),
(6, 1159, true),
(7, 1160, true),
(7, 1161, true),
(2, 1162, true),
(3, 1162, true),
(4, 1162, true),
(5, 1162, true),
(6, 1162, true),
(2, 1163, true),
(3, 1163, true),
(4, 1163, true),
(5, 1163, true),
(6, 1163, true),
(2, 1164, true),
(3, 1164, true),
(4, 1164, true),
(5, 1164, true),
(6, 1164, true),
(2, 1166, true),
(3, 1166, true),
(4, 1166, true),
(7, 1166, true),
(2, 1167, true),
(3, 1167, true),
(4, 1167, true),
(6, 1167, true);

/* admin/user */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1165, 208, 'request', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(2, 1165, true),
(3, 1165, true),
(4, 1165, true),
(5, 1165, true),
(6, 1165, true),
(7, 1165, true);

/* admin/log */
INSERT INTO RsOp(RsOp_id, Resource_id, opCode, isPrim, jsonfp) VALUES
(1170, 209, 'download', true, null),
(1171, 209, 'query', true, null),
(1172, 209, 'userBehavior', true, null),
(1173, 209, 'usePattern', true, null);

INSERT INTO OpAccess(ExeRole_id, RsOp_id, ok) VALUES
(2, 1170, true),
(2, 1171, true),
(3, 1171, true),
(4, 1171, true),
(2, 1172, true),
(3, 1172, true),
(4, 1172, true),
(2, 1173, true),
(3, 1173, true),
(4, 1173, true);

INSERT INTO Person(Person_id, fname, lname, isNature) VALUES
(10, 'Creator', 'coimApp', false),
(20, 'Guest', '', true),
(100, 'Test', 'User', false);

INSERT INTO GrpUser(GrpUser_id, UGroup_id, Person_id, accName, passwd, ExeRole_id, isValid) VALUES
(10, 10, 10, 'Admin', null, 2, 1),
(20, 10, 20, 'Guest', null, 7, 1),
(103, 10, 100, 'apiMember', '39259b0a94740685eeba2c50b057b02cad8eea609c442a79', 6, 1);